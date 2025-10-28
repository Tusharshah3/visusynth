import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { User } from "@supabase/supabase-js";

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<string>("eng");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Store files and metadata for processing
      const fileData = {
        fileCount: files.length,
        language,
        timestamp: new Date().toISOString(),
      };

      // Navigate to process page with files
      navigate("/process", { 
        state: { 
          files, 
          language,
          fileData 
        } 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Upload Documents
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your images or scanned documents to convert them into searchable PDFs
            </p>
          </div>

          <div className="space-y-6 animate-slide-up">
            <FileUpload onFilesSelected={handleFilesSelected} />

            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-base font-semibold mb-2 block">
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="hin">Hindi</SelectItem>
                    <SelectItem value="eng+hin">English + Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Features</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Multi-language OCR with enhanced image preprocessing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>AI-powered text summarization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Interactive text editor with real-time preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Export as PDF, TXT, or Markdown</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleProcess}
                disabled={loading || files.length === 0}
                size="lg"
                className="gradient-primary shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Documents <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Upload;
