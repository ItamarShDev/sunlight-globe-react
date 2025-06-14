import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";
import { GlobePage } from "./pages/GlobePage";
import { getCountries } from "./api/countries";

// Create the router with a loader for the GlobePage
const router = createBrowserRouter([
  {
    path: "/",
    element: <GlobePage />,
    loader: async () => {
      try {
        const countries = await getCountries();
        return { countries };
      } catch (error) {
        console.error("Error in route loader:", error);
        // Return empty array to prevent the page from failing to load
        return { countries: [] };
      }
    },
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
