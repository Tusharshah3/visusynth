import { FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VisuSynth
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 VisuSynth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
