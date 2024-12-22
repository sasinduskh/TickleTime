import { Project, Task } from "@/types/project";
import { calculateCost } from "@/utils/calculateCost";
import { formatTime } from "@/utils/formatTime";

interface UserReportProps {
  user: {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    hourlyRate: number;
  };
  projects: Project[];
}

export default function UserReport({ user, projects }: UserReportProps) {
  const totalProjectTime = projects.reduce((total, project) => {
    return (
      total +
      (Array.isArray(project.tasks)
        ? project.tasks.reduce(
            (projectTotal, task: Task) => projectTotal + task.totalTime,
            0
          )
        : 0)
    );
  }, 0);

  const totalProjectCost = calculateCost(totalProjectTime, user.hourlyRate);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        User Report for {user.displayName}
      </h1>
      <div className="mb-4">
        <p>Total Project Time: {formatTime(totalProjectTime)}</p>
        <p>Total Project Cost: LKR {totalProjectCost.toFixed(2)}</p>
      </div>
      {projects.map((project) => (
        <div key={project.id} className="mb-4">
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <ul className="list-disc pl-5">
            {Array.isArray(project.tasks) &&
              project.tasks.map((task) => (
                <li key={task.id}>
                  {task.name} - {formatTime(task.totalTime)} - LKR{" "}
                  {calculateCost(task.totalTime, project.hourlyRate).toFixed(2)}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
