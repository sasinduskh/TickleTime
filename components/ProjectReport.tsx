import { Project, Task } from "@/types/project";
import { formatTime } from "@/utils/formatTime";
import { calculateCost } from "@/utils/calculateCost";

interface ProjectReportProps {
  projects: Project[];
}

export default function ProjectReport({ projects }: ProjectReportProps) {
  const totalTime = projects.reduce((total, project) => {
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

  const totalCost = projects.reduce((total, project) => {
    return (
      total +
      (Array.isArray(project.tasks)
        ? calculateCost(
            project.tasks.reduce(
              (projectTotal, task: Task) => projectTotal + task.totalTime,
              0
            ),
            project.hourlyRate
          )
        : 0)
    );
  }, 0);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Project Report</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border-b pb-4">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p>
              Total Time:{" "}
              {formatTime(
                Array.isArray(project.tasks)
                  ? project.tasks.reduce(
                      (total, task) => total + task.totalTime,
                      0
                    )
                  : 0
              )}
            </p>
            <p>
              Total Cost: LKR{" "}
              {Array.isArray(project.tasks)
                ? calculateCost(
                    project.tasks.reduce(
                      (total, task) => total + task.totalTime,
                      0
                    ),
                    project.hourlyRate
                  ).toFixed(2)
                : "0.00"}
            </p>
            <h4 className="text-md font-semibold mt-2">Tasks:</h4>
            <ul className="list-disc pl-5">
              {Array.isArray(project.tasks) &&
                project.tasks.map((task) => (
                  <li key={task.id}>
                    {task.name} - {formatTime(task.totalTime)} - LKR{" "}
                    {calculateCost(task.totalTime, project.hourlyRate).toFixed(
                      2
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Overall Summary</h3>
        <p>Total Time: {formatTime(totalTime)}</p>
        <p>Total Cost: LKR {totalCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
