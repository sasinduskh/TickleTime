import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Project, Task, User as CustomUser } from "../types/project";
import TaskItem from "./TaskItem";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { formatTime } from "../utils/formatTime";
import { calculateCost } from "../utils/calculateCost";
import { PlusCircle, Download } from "lucide-react";
import { ref, onValue, push, set } from "firebase/database";
import { rtdb } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface ProjectDetailsProps {
  project: Project;
  currentUser: User;
  userData: CustomUser;
}

export default function ProjectDetails({
  project,
  currentUser,
  userData,
}: ProjectDetailsProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const [projectData, setProjectData] = useState<Project>(project);
  const [sharedUsers, setSharedUsers] = useState<CustomUser[]>([]);

  useEffect(() => {
    const projectRef = ref(rtdb, `projects/${project.id}`);
    const unsubscribe = onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProjectData(data);
      }
    });

    return () => unsubscribe();
  }, [project.id]);

  useEffect(() => {
    const fetchSharedUsers = async () => {
      const users: CustomUser[] = [];
      for (const uid of projectData.sharedWith) {
        const userRef = ref(rtdb, `users/${uid}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            users.push(userData);
          }
        });
      }
      setSharedUsers(users);
    };

    fetchSharedUsers();
  }, [projectData.sharedWith]);

  const addTask = async () => {
    if (newTaskName.trim()) {
      const tasksRef = ref(rtdb, `projects/${project.id}/tasks`);
      const newTaskRef = push(tasksRef);
      const newTask: Task = {
        id: newTaskRef.key!,
        name: newTaskName.trim(),
        startTime: null,
        totalTime: 0,
        assignedTo: null,
      };
      await set(newTaskRef, newTask);
      setNewTaskName("");
      toast.success("New task added");
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskRef = ref(rtdb, `projects/${project.id}/tasks/${taskId}`);
    await set(taskRef, null);
    toast.success("Task deleted");
  };

  const downloadCSV = () => {
    const headers = ["Task Name", "Assigned To", "Total Time", "Cost"];
    const csvContent = [
      headers.join(","),
      ...Object.values(projectData.tasks).map((task: any) =>
        [
          task.name,
          task.assignedTo || "Unassigned",
          formatTime(task.totalTime),
          calculateCost(task.totalTime, userData.hourlyRate || 0).toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${projectData.name}_report.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("CSV report downloaded");
  };

  const totalProjectTime = Object.values(projectData.tasks).reduce(
    (total: any, task: any) => total + task.totalTime,
    0
  );
  const totalProjectCost: any = calculateCost(
    totalProjectTime as any,
    userData.hourlyRate || 0
  );

  return (
    <Card className="relative bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
            {projectData.name}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage tasks and track progress
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-semibold mb-6 p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg shadow-md">
            <div className="space-y-2">
              <div className="text-lg text-gray-700">
                Total Project Time:{" "}
                <span className="text-blue-600 font-bold">
                  {formatTime(totalProjectTime as any)}
                </span>
              </div>
              <div className="text-lg text-gray-700">
                Total Project Cost:{" "}
                <span className="text-purple-600 font-bold">
                  LKR {totalProjectCost.toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={downloadCSV}
              className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </div>
        </CardContent>
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New task name"
            className="flex-grow"
          />
          <Button
            onClick={addTask}
            className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        <ul className="space-y-4 mb-4">
          {Object.values(projectData.tasks).map((task: any) => (
            <TaskItem
              key={task.id}
              task={task}
              updateTask={() => {}}
              deleteTask={deleteTask}
              hourlyRate={userData.hourlyRate || 0}
              sharedUsers={sharedUsers}
              currentUser={currentUser}
              projectId={project.id}
            />
          ))}
        </ul>
        {sharedUsers.length > 0 && (
          <div className="mt-8 bg-white bg-opacity-50 p-6 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2 text-lg text-gray-700">
              Shared with:
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {sharedUsers.map((user) => (
                <li key={user.uid} className="text-gray-600">
                  {user.email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
