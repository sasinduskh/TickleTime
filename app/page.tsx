"use client";
import "./globals.css";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Project, User as CustomUser } from "../types/project";
import ProjectList from "../components/ProjectList";
import ProjectDetails from "../components/ProjectDetails";
import Auth from "../components/Auth";
import ProjectReport from "../components/ProjectReport";
import UserSettings from "../components/UserSettings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [userData, setUserData] = useState<CustomUser | null>(null);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "projects"),
        where("ownerId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsData);
      });

      const userRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserData({
            ...user,
            ...doc.data(),
            hourlyRate: doc.data().hourlyRate || 0,
            publicShareId: doc.data().publicShareId || "",
          } as CustomUser);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeUser();
      };
    }
  }, [user]);

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setShowReport(false);
  };

  console.log(showReport);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold mb-4 md:mb-0">
            TickleTime ⏰✨{" "}
            <span className="text-sm">
              Create by
              <Link
                className="underline"
                href="https://sk-website-topaz.vercel.app/projects"
                target="_blank"
              >
                {" "}
                SK
              </Link>
            </span>
          </h1>
          <Auth onUserChange={setUser} />
        </div>
        {userData && (
          <UserSettings
            user={userData as any}
            hourlyRate={userData.hourlyRate || 0}
            publicShareId={userData.publicShareId}
          />
        )}
        {user && (
          <Tabs defaultValue="projects" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProjectList
                  projects={projects}
                  selectProject={selectProject}
                />
                {selectedProject && userData && (
                  <ProjectDetails
                    project={selectedProject}
                    currentUser={user}
                    userData={userData}
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent value="report">
              <ProjectReport projects={projects} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
