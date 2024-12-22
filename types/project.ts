export interface User {
  uid: string;
  email: string;
  displayName: string;
  hourlyRate: number;
  publicShareId?: string;
}

export interface Task {
  id: string;
  name: string;
  startTime: number | null;
  totalTime: number;
  assignedTo: string | null;
}

export interface Project {
  id: string;
  name: string;
  tasks: any;
  ownerId: string;
  sharedWith: string[];
  publicShareId?: string;
  hourlyRate: number;
}
