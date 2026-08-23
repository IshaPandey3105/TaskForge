import Projects from "../../pages/projects/Projects";
import ProjectDetails from "../../pages/projects/ProjectDetails";

const projectRoutes = [
  {
    path: "/projects",
    element: <Projects />,
  },
  {
    path: "/projects/:projectId",
    element: <ProjectDetails />,
  },
];

export default projectRoutes;