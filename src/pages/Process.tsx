import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, FileText } from "lucide-react";
import { createWorker } from "tesseract.js";
import { PDFDocument, rgb } from "pdf-lib";
import { User } from "@supabase/supabase-js";

const Process = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(true);
  const [extractedText, setExtractedText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const files = location.state?.files || [];
  const language = location.state?.language || "eng";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (files.length === 0) {
      navigate("/upload");
      return;
    }

    processFiles();
  }, [files]);

  const processFiles = async () => {
    setProcessing(true);
    let allText = "";

    try {
      const worker = await createWorker(language);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image. Please upload only image files.`);
        }
        
        setProgress(((i + 1) / files.length) * 90);

        const { data: { text } } = await worker.recognize(file);
        allText += `\n\n--- Page ${i + 1} ---\n\n${text}`;
      }

      await worker.terminate();

      setExtractedText(allText.trim());
      setEditedText(allText.trim());
      setProgress(100);

      toast({
        title: "Processing complete!",
        description: `Successfully extracted text from ${files.length} file(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process files",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const textLines = editedText.split("\n");
      const linesPerPage = 50;
      
      for (let i = 0; i < textLines.length; i += linesPerPage) {
        const page = pdfDoc.addPage();
        const { height } = page.getSize();
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        
        const pageLines = textLines.slice(i, i + linesPerPage);
        const text = pageLines.join("\n");
        
        page.drawText(text, {
          x: 50,
          y: height - 50,
          size: fontSize,
          color: rgb(0, 0, 0),
          lineHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setPdfBlob(blob);

      toast({
        title: "PDF Generated!",
        description: "Your searchable PDF is ready to download",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visusynth-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {processing ? "Processing Documents..." : "Review & Edit"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {processing
                ? "Please wait while we extract text from your documents"
                : "Review and edit the extracted text before generating your PDF"}
            </p>
          </div>

          {processing && (
            <Card className="p-8 mb-6 animate-slide-up">
              <div className="flex items-center gap-4 mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-lg font-medium">Processing {files.length} file(s)...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-4">
                {progress}% complete
              </p>
            </Card>
          )}

          {!processing && (
            <div className="grid lg:grid-cols-2 gap-6 animate-slide-up">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Extracted Text
                </h2>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Extracted text will appear here..."
                />
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <div className="space-y-4">
                  <Button
                    onClick={generatePDF}
                    className="w-full gradient-primary shadow-glow"
                    size="lg"
                    disabled={!editedText}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Generate Searchable PDF
                  </Button>

                  {pdfBlob && (
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF
                    </Button>
                  )}

                  <Button
                    onClick={() => navigate("/upload")}
                    variant="ghost"
                    className="w-full"
                  >
                    Process More Documents
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Processing Info</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Files processed: {files.length}</li>
                    <li>• Language: {language === "eng" ? "English" : language === "hin" ? "Hindi" : "English + Hindi"}</li>
                    <li>• Characters: {editedText.length}</li>
                  </ul>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Process;
