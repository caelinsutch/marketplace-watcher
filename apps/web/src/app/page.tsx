import { Navigation } from "@/components/navigation";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Button } from "@marketplace-watcher/ui/components/ui/button";
import { Card } from "@marketplace-watcher/ui/components/ui/card";
import { Bell, Clock, Mail, Search, Shield, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none animate-gradient" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight slide-in-up">
              Never Miss a Deal on
              <br />
              <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-gradient">
                Facebook Marketplace
              </span>
            </h1>
            <p
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto slide-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Set up automated monitors for items you're looking for and get
              instant notifications when new matches appear. Save time and snag
              the best deals before anyone else.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4 slide-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button asChild size="lg" className="text-base button-press ">
                <Link href="/auth/sign-up">Get Started Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base button-press hover-lift"
              >
                <Link href="#how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Find Great Deals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our powerful monitoring tools help you stay ahead of the
              competition
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-fade-in">
            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Smart Search Monitoring
              </h3>
              <p className="text-muted-foreground">
                Create monitors with specific keywords, locations, and price
                ranges. Our system continuously checks for new matches.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Instant Notifications
              </h3>
              <p className="text-muted-foreground">
                Get notified immediately when new items match your criteria.
                Never miss out on a great deal again.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Price Drop Alerts</h3>
              <p className="text-muted-foreground">
                Track price changes and get alerted when sellers reduce their
                prices on items you're watching.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Monitoring</h3>
              <p className="text-muted-foreground">
                Our system works around the clock, checking for new listings
                even while you sleep.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Alerts</h3>
              <p className="text-muted-foreground">
                Receive detailed email notifications with listing information
                and direct links to view items.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-sm transition-shadow card-3d">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 ">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your search preferences and data are kept private and secure. We
                never share your information.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes with our simple three-step process
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <ScrollReveal delay={100}>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold ">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a Monitor</h3>
                <p className="text-muted-foreground">
                  Set up your search criteria including keywords, location, and
                  price range for items you want to track.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold ">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">We Watch For You</h3>
                <p className="text-muted-foreground">
                  Our system continuously monitors Facebook Marketplace for new
                  listings that match your criteria.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold ">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Notified</h3>
                <p className="text-muted-foreground">
                  Receive instant alerts when new matches are found, so you can
                  act fast and secure the best deals.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Find Your Next Great Deal?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of savvy shoppers who never miss out on marketplace
            bargains.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/auth/sign-up">Start Monitoring Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Marketplace Watcher. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Powered by Supabase
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
