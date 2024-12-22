import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { Task, User as CustomUser } from "../types/project";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { formatTime } from "../utils/formatTime";
import { calculateCost } from "../utils/calculateCost";
import { Play, Pause } from "lucide-react";
import { ref, onValue, set } from "firebase/database";
import { rtdb } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface TaskItemProps {
  task: Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  hourlyRate: number;
  sharedUsers: CustomUser[];
  currentUser: User;
  projectId: string;
}

export default function TaskItem({
  task,
  hourlyRate,
  sharedUsers,
  currentUser,
  projectId,
}: TaskItemProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(task.totalTime);
  // const startTimeRef = useRef<number | null>(null);
  const taskRef = useRef(task);

  useEffect(() => {
    const taskDbRef = ref(rtdb, `projects/${projectId}/tasks/${task.id}`);
    const unsubscribe = onValue(taskDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        taskRef.current = data;
        setElapsedTime(data.totalTime);
        setIsRunning(!!data.startTime);
      }
    });

    return () => unsubscribe();
  }, [projectId, task.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1000);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    const taskDbRef = ref(rtdb, `projects/${projectId}/tasks/${task.id}`);
    const now = Date.now();
    if (newIsRunning) {
      set(taskDbRef, {
        ...taskRef.current,
        startTime: now,
      });
      toast.success("Timer started");
    } else {
      const newTotalTime =
        taskRef.current.totalTime + (now - (taskRef.current.startTime || now));
      set(taskDbRef, {
        ...taskRef.current,
        totalTime: newTotalTime,
        startTime: null,
      });
      toast.success("Timer stopped");
    }
  };

  const assignTask = (userId: string) => {
    const taskDbRef = ref(rtdb, `projects/${projectId}/tasks/${task.id}`);
    set(taskDbRef, {
      ...taskRef.current,
      assignedTo: userId,
    });
    toast.success("Task assigned");
  };

  const taskCost = calculateCost(elapsedTime, hourlyRate);

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col mb-4 sm:mb-0 sm:mr-4 flex-grow">
        <span className="font-semibold text-lg text-gray-800 mb-3">
          {taskRef.current.name}
        </span>
        <Select
          onValueChange={assignTask}
          defaultValue={taskRef.current.assignedTo || ""}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Assign to..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={currentUser.uid}>
              {currentUser.displayName || currentUser.email}
            </SelectItem>
            {sharedUsers.map((user) => (
              <SelectItem key={user.uid} value={user.uid}>
                {user.displayName || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-2xl font-bold text-blue-600 mb-2">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          LKR {taskCost.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={toggleTimer}
            className={`${
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white px-6 py-2`}
          >
            {isRunning ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? "Stop" : "Start"}
          </Button>
        </div>
      </div>
    </li>
  );
}
