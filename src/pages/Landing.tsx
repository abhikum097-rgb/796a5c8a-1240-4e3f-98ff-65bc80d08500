import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BarChart3, Clock, Trophy, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">PrepAce</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Affordable Test Prep That <span className="text-primary">Actually Works</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Master high school entrance exams with comprehensive practice tests, detailed analytics, 
            and personalized study plans. Join thousands of students who've improved their scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/dashboard/practice">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Start Practicing
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Free 14-Day Trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive tools designed to maximize your test performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>10+ Practice Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full-length practice exams for SHSAT, SSAT, ISEE, HSPT, and TACHS
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>2000+ Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive question bank with detailed explanations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track progress, identify weak areas, and optimize study time
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Adaptive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Personalized study plans that adapt to your learning pace
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your test prep needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free Trial</CardTitle>
                <div className="text-4xl font-bold text-foreground mt-4">
                  $0
                  <span className="text-base text-muted-foreground font-normal">
                    /14 days
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Access to 1 practice test</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>50 practice questions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Basic performance analytics</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Single Test */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Single Test</CardTitle>
                <div className="text-4xl font-bold text-foreground mt-4">
                  $9.99
                  <span className="text-base text-muted-foreground font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Full access to one test type</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>500+ practice questions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Detailed analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Progress tracking</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            {/* All Access */}
            <Card className="relative border-primary border-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>Most Popular</span>
                </div>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">All Access</CardTitle>
                <div className="text-4xl font-bold text-foreground mt-4">
                  $49.99
                  <span className="text-base text-muted-foreground font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>All test types included</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>2000+ practice questions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Personalized study plans</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/10 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">PrepAce</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 PrepAce. All rights reserved. Helping students succeed on high school entrance exams.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;