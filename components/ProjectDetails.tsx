import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project, Task, User as CustomUser } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTime } from "@/utils/formatTime";
import { calculateCost } from "@/utils/calculateCost";
import { PlusCircle } from "lucide-react";
import TaskItem from "./TaskItem";

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
  const [sharedUserEmail, setSharedUserEmail] = useState("");
  const [projectData, setProjectData] = useState<Project>({
    ...project,
    tasks: project.tasks || [],
  });
  const [sharedUsers, setSharedUsers] = useState<CustomUser[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "projects", project.id), (doc) => {
      if (doc.exists()) {
        setProjectData(doc.data() as Project);
      }
    });

    return () => unsubscribe();
  }, [project.id]);

  useEffect(() => {
    const fetchSharedUsers = async () => {
      const users: CustomUser[] = [];
      if (Array.isArray(projectData?.sharedWith)) {
        for (const uid of projectData.sharedWith) {
          const userDoc = doc(db, "users", uid);
          const userSnapshot = await getDoc(userDoc);
          if (userSnapshot.exists()) {
            users.push(userSnapshot.data() as CustomUser);
          }
        }
      }
      setSharedUsers(users);
    };

    fetchSharedUsers();
  }, [projectData?.sharedWith]);

  const addTask = async () => {
    if (newTaskName.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        name: newTaskName.trim(),
        startTime: null,
        totalTime: 0,
        assignedTo: null,
      };
      await updateDoc(doc(db, "projects", project.id), {
        tasks: arrayUnion(newTask),
      });
      setNewTaskName("");
    }
  };

  const updateTask = async (updatedTask: Task) => {
    const updatedTasks =
      projectData.tasks?.map((task: any) =>
        task.id === updatedTask.id ? updatedTask : task
      ) || [];
    await updateDoc(doc(db, "projects", project.id), {
      tasks: updatedTasks,
    });
  };

  const deleteTask = async (taskId: string) => {
    const taskToDelete: any = projectData?.tasks?.find(
      (task: Task) => task.id === taskId
    );
    if (taskToDelete) {
      await updateDoc(doc(db, "projects", project.id), {
        tasks: arrayRemove(taskToDelete),
      });
    }
  };

  const shareProject = async () => {
    if (sharedUserEmail.trim()) {
      await updateDoc(doc(db, "projects", project.id), {
        sharedWith: arrayUnion(sharedUserEmail.trim()),
      });
      setSharedUserEmail("");
    }
  };

  const totalProjectTime: number = Array.isArray(projectData.tasks)
    ? projectData.tasks.reduce(
        (total: number, task: Task) => total + task.totalTime,
        0
      )
    : 0;
  const totalProjectCost = calculateCost(
    totalProjectTime,
    userData.hourlyRate || 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projectData.name}</CardTitle>
        <CardDescription>Manage tasks and track progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-semibold mb-4 p-4 bg-gray-100 rounded-lg">
          <div>Total Project Time: {formatTime(totalProjectTime)}</div>
          <div>Total Project Cost: LKR {totalProjectCost.toFixed(2)}</div>
        </div>
        <div className="flex mb-4">
          <Input
            type="email"
            value={sharedUserEmail}
            onChange={(e) => setSharedUserEmail(e.target.value)}
            placeholder="Share with (email)"
            className="mr-2"
          />
          <Button
            onClick={shareProject}
            className="bg-black text-white hover:bg-gray-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Shared with:</h3>
          <ul className="list-disc pl-5">
            {sharedUsers.map((user) => (
              <li key={user.uid}>{user.email}</li>
            ))}
          </ul>
        </div>
        <div className="flex mt-10 mb-4">
          <Input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New task name"
            className="mr-2"
          />
          <Button
            onClick={addTask}
            className="bg-black text-white hover:bg-gray-800"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        <div>
          <ul className="space-y-2 mb-4">
            {projectData.tasks.map((task: any) => (
              <TaskItem
                key={task.id}
                task={task}
                updateTask={updateTask}
                deleteTask={deleteTask}
                hourlyRate={userData.hourlyRate || 0}
                sharedUsers={sharedUsers}
                currentUser={currentUser}
                projectId={project.id}
              />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
