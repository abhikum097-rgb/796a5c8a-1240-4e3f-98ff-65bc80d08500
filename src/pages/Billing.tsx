import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Download } from "lucide-react";
import { useApp } from "@/context/AppContext";

const Billing = () => {
  const { state } = useApp();
  const user = state.user;

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['5 practice questions per day', 'Basic progress tracking', 'Community support'],
      current: user.subscriptionTier === 'free'
    },
    {
      name: 'Single Test',
      price: '$9.99',
      period: 'per month',
      features: ['Unlimited practice for 1 test', 'Detailed analytics', 'Priority support', 'Offline access'],
      current: user.subscriptionTier === 'single_test'
    },
    {
      name: 'All Access',
      price: '$49.99',
      period: 'per month',
      features: ['Unlimited practice for all tests', 'Advanced analytics', 'Priority support', 'Offline access', 'Custom study plans'],
      current: user.subscriptionTier === 'all_access'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Subscription</span>
          </CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold capitalize">{user.subscriptionTier.replace('_', ' ')}</h3>
              <p className="text-muted-foreground">Next billing date: January 15, 2024</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.current ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && <Badge>Current</Badge>}
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Download your invoices and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((invoice) => (
              <div key={invoice} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">Invoice #{`2024-00${invoice}`}</p>
                  <p className="text-sm text-muted-foreground">December {invoice * 10}, 2023</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-medium">$9.99</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;