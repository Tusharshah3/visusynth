import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import {
  Scan,
  Languages,
  Edit3,
  FileText,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

interface LandingProps {
  user: User | null;
}

const Landing = ({ user }: LandingProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero py-24 px-4">
          <div className="container mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Transform Documents
              <br />
              <span className="text-white/90">Into Searchable PDFs</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              AI-powered OCR that converts images and scanned documents into
              fully searchable, editable PDFs. Support for English, Hindi, and
              handwriting recognition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? "/upload" : "/auth"}>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-elegant text-lg px-8"
                >
                  Start Converting <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 text-lg px-8"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gradient-subtle">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to digitize your documents with precision
                and ease
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Scan}
                title="Advanced OCR"
                description="Extract text from images with high accuracy using state-of-the-art OCR technology"
              />
              <FeatureCard
                icon={Languages}
                title="Multi-Language"
                description="Support for English and Hindi text recognition with automatic language detection"
              />
              <FeatureCard
                icon={Edit3}
                title="Text Editing"
                description="Edit extracted text in an intuitive interface before generating your PDF"
              />
              <FeatureCard
                icon={FileText}
                title="Searchable PDFs"
                description="Generate PDFs with embedded text layer for full-text search capability"
              />
              <FeatureCard
                icon={Zap}
                title="Batch Processing"
                description="Upload and process multiple documents at once to save time"
              />
              <FeatureCard
                icon={Shield}
                title="Secure & Private"
                description="Your documents are processed securely with end-to-end encryption"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-elegant">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Digitize Your Documents?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users who trust VisuSynth for their document
                processing needs
              </p>
              <Link to={user ? "/upload" : "/auth"}>
                <Button size="lg" className="gradient-primary shadow-glow text-lg px-8">
                  Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
