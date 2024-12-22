import { useState } from 'react'
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { Project } from '../types/project'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"

interface ProjectListProps {
  projects: Project[]
  selectProject: (project: Project) => void
}

export default function ProjectList({ projects, selectProject }: ProjectListProps) {
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleAddProject = async () => {
    if (newProjectName.trim() && auth.currentUser) {
      try {
        await addDoc(collection(db, 'projects'), {
          name: newProjectName.trim(),
          tasks: [],
          hourlyRate: 2550,
          ownerId: auth.currentUser.uid,
          sharedWith: []
        })
        setNewProjectName('')
      } catch (error) {
        console.error('Error adding project: ', error)
      }
    }
  }

  const handleEditProject = async (project: Project) => {
    if (editingProject && editingProject.name.trim()) {
      try {
        await updateDoc(doc(db, 'projects', project.id), {
          name: editingProject.name.trim()
        })
        setEditingProject(null)
      } catch (error) {
        console.error('Error updating project: ', error)
      }
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId))
    } catch (error) {
      console.error('Error deleting project: ', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Manage your projects here</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <Input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="mr-2"
          />
          <Button onClick={handleAddProject} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        <ul className="space-y-2">
          {projects.map(project => (
            <li key={project.id} className="flex items-center justify-between">
              <Button 
                variant="outline" 
                className="w-full text-left justify-start hover:bg-gray-100 mr-2"
                onClick={() => selectProject(project)}
              >
                {project.name}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setEditingProject(project)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={editingProject?.name || ''}
                    onChange={(e) => setEditingProject(prev => prev ? {...prev, name: e.target.value} : null)}
                    className="mb-4"
                  />
                  <Button onClick={() => handleEditProject(project)}>Save Changes</Button>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="icon"
                className="ml-2" 
                onClick={() => handleDeleteProject(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

