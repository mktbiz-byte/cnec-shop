import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Prediction from "./pages/Prediction";
import Newsletter from "./pages/Newsletter";
import Trends from "./pages/Trends";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CreatorProfile from "./pages/CreatorProfile";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/login"} component={Login} />
      <Route path={"/@:username"} component={CreatorProfile} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/prediction"} component={Prediction} />
      <Route path={"/newsletter"} component={Newsletter} />
      <Route path={"/trends"} component={Trends} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/reports/:id"} component={ReportDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
