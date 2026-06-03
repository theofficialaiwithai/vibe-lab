import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Hub from "@/pages/Hub";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-background text-foreground">
              <Home />
            </div>
          }
        />
        <Route
          path="/assessment"
          element={
            <div className="min-h-screen bg-background text-foreground">
              <Assessment />
            </div>
          }
        />
        <Route
          path="/results/:token"
          element={
            <div className="min-h-screen bg-background text-foreground">
              <Results />
            </div>
          }
        />
        <Route
          path="/hub"
          element={
            <div className="min-h-screen bg-background text-foreground">
              <Hub />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
