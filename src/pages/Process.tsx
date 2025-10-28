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
import { Loader2, Download, FileText, Sparkles, Copy, FileDown } from "lucide-react";
import { createWorker } from "tesseract.js";
import { PDFDocument, rgb } from "pdf-lib";
import { User } from "@supabase/supabase-js";
import { preprocessImage } from "@/utils/imagePreprocessing";
import { downloadAsText, downloadAsMarkdown, copyToClipboard } from "@/utils/exportUtils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [usePreprocessing, setUsePreprocessing] = useState(true);
  const [useAiCorrection, setUseAiCorrection] = useState(true);
  const [processingStep, setProcessingStep] = useState("");

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
      setProcessingStep("Initializing OCR engine...");
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.floor(m.progress * 90);
            setProgress(progress);
          }
        }
      });

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image. Please upload only image files.`);
        }

        setProcessingStep(`Processing file ${i + 1} of ${files.length}...`);
        
        // Preprocess image if enabled
        if (usePreprocessing) {
          setProcessingStep(`Enhancing image ${i + 1}...`);
          file = await preprocessImage(file);
        }
        
        setProgress(((i + 1) / files.length) * 90);
        setProcessingStep(`Extracting text from file ${i + 1}...`);

        const { data: { text } } = await worker.recognize(file);
        
        // Preserve spacing and line breaks from OCR
        const formattedText = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        allText += `\n\n--- Page ${i + 1} ---\n\n${formattedText}\n`;
      }

      await worker.terminate();

      let finalText = allText.trim();

      // Apply AI correction if enabled
      if (useAiCorrection && finalText.length > 0) {
        setProcessingStep("AI is correcting OCR errors...");
        setProgress(95);
        
        try {
          const { data, error } = await supabase.functions.invoke('correct-ocr-text', {
            body: { text: finalText }
          });

          if (error) throw error;

          if (data?.correctedText) {
            finalText = data.correctedText;
            toast({
              title: "AI correction applied!",
              description: "Text has been improved with AI",
            });
          }
        } catch (error: any) {
          console.error("AI correction error:", error);
          toast({
            title: "AI correction failed",
            description: "Using original OCR text",
            variant: "destructive",
          });
        }
      }

      setProcessingStep("Finalizing...");
      setExtractedText(finalText);
      setEditedText(finalText);
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
      setProcessingStep("");
    }
  };

  const handleSummarize = async () => {
    if (!editedText || editedText.length < 100) {
      toast({
        title: "Text too short",
        description: "Please provide at least 100 characters to summarize",
        variant: "destructive",
      });
      return;
    }

    setSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-text', {
        body: { text: editedText }
      });

      if (error) throw error;

      if (data?.summary) {
        setSummary(data.summary);
        toast({
          title: "Summary generated!",
          description: "AI-powered summary is ready",
        });
      }
    } catch (error: any) {
      toast({
        title: "Summarization failed",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setSummarizing(false);
    }
  };

  const handleCopyText = async () => {
    const success = await copyToClipboard(editedText);
    if (success) {
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
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
                <div>
                  <span className="text-lg font-medium">Processing {files.length} file(s)...</span>
                  {processingStep && (
                    <p className="text-sm text-muted-foreground mt-1">{processingStep}</p>
                  )}
                </div>
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

              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Actions</h2>
                  <div className="space-y-3">
                    <Button
                      onClick={handleSummarize}
                      className="w-full"
                      variant="outline"
                      size="lg"
                      disabled={!editedText || summarizing}
                    >
                      {summarizing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          AI Summarize
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={generatePDF}
                      className="w-full gradient-primary shadow-glow"
                      size="lg"
                      disabled={!editedText}
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Generate PDF
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

                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadAsText(editedText)}
                        variant="ghost"
                        className="flex-1"
                        disabled={!editedText}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        TXT
                      </Button>
                      <Button
                        onClick={() => downloadAsMarkdown(editedText)}
                        variant="ghost"
                        className="flex-1"
                        disabled={!editedText}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        MD
                      </Button>
                      <Button
                        onClick={handleCopyText}
                        variant="ghost"
                        className="flex-1"
                        disabled={!editedText}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>

                    <Button
                      onClick={() => navigate("/upload")}
                      variant="ghost"
                      className="w-full"
                    >
                      Process More Documents
                    </Button>
                  </div>
                </div>

                {summary && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Summary
                    </h3>
                    <p className="text-sm">{summary}</p>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Processing Info</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Files processed: {files.length}</li>
                      <li>• Language: {language === "eng" ? "English" : language === "hin" ? "Hindi" : "English + Hindi"}</li>
                      <li>• Characters: {editedText.length}</li>
                      <li>• Words: {editedText.split(/\s+/).filter(w => w.length > 0).length}</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-correction" className="text-sm font-medium">
                      AI Text Correction
                    </Label>
                    <Switch
                      id="ai-correction"
                      checked={useAiCorrection}
                      onCheckedChange={setUseAiCorrection}
                      disabled={processing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses AI to fix OCR errors and improve text accuracy
                  </p>
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
