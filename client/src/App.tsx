import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Checkout from "./pages/Checkout";
import Contract from "./pages/Contract";
import Dashboard from "./pages/Dashboard";
import DemoPayment from "./pages/DemoPayment";
import Home from "./pages/Home";
import PersonaGate from "./pages/PersonaGate";
import PaymentProcessing from "./pages/PaymentProcessing";
import Success from "./pages/Success";

function Router() {
  return <Switch>
    <Route path="/" component={PersonaGate} />
    <Route path="/accounting-offices"><Home fixedPersona="firm" /></Route>
    <Route path="/companies"><Home fixedPersona="company" /></Route>
    <Route path="/checkout" component={Checkout} />
    <Route path="/demo-payment/:token" component={DemoPayment} />
    <Route path="/payment-processing/:token" component={PaymentProcessing} />
    <Route path="/success/:token" component={Success} />
    <Route path="/contract/:token" component={Contract} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
