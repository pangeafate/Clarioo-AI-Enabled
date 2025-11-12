import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, LogOut, User, FolderOpen, Edit, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as projectService from "@/services/mock/projectService";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}
interface ProjectDashboardProps {
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
  onProjectsLoaded?: (projects: Project[]) => void;
}
const ProjectDashboard = ({
  onSelectProject,
  selectedProjectId,
  onProjectsLoaded
}: ProjectDashboardProps) => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: ''
  });
  useEffect(() => {
    fetchProjects();
  }, []);
  // 🎨 PROTOTYPE MODE: Using mock project service
  const fetchProjects = async () => {
    try {
      const { data, error } = await projectService.getProjects(user?.id);

      if (error) throw new Error(error.message);

      // Map projectService.Project to local Project interface
      const mappedProjects: Project[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      // Sort by updated_at descending
      mappedProjects.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setProjects(mappedProjects);

      // Notify parent about loaded projects for auto-selection
      onProjectsLoaded?.(mappedProjects);
    } catch (error) {
      toast({
        title: "Error fetching projects",
        description: "Could not load your projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // 🎨 PROTOTYPE MODE: Using mock project service
  const createProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      const { data, error } = await projectService.createProject({
        user_id: user?.id || 'user_demo_12345',
        name: newProject.name,
        description: newProject.description || '',
        category: 'General', // Default category for prototype
        status: 'draft',
        workflow_state: {
          current_step: 1,
          completed_steps: []
        }
      });

      if (error) throw new Error(error.message);

      if (!data) throw new Error('No data returned');

      // Map to local Project interface
      const newProjectData: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setProjects([newProjectData, ...projects]);
      setNewProject({ name: '', description: '' });
      setShowCreateDialog(false);
      onSelectProject(newProjectData);

      toast({
        title: "Project created",
        description: "Your project has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error creating project",
        description: "Could not create the project. Please try again.",
        variant: "destructive"
      });
    }
  };
  const startEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditedProject({
      name: project.name,
      description: project.description || ''
    });
    setShowEditDialog(true);
  };
  // 🎨 PROTOTYPE MODE: Using mock project service
  const updateProject = async () => {
    if (!editingProject || !editedProject.name.trim()) return;
    try {
      const { data, error } = await projectService.updateProject(
        editingProject.id,
        {
          name: editedProject.name,
          description: editedProject.description || ''
        }
      );

      if (error) throw new Error(error.message);

      if (!data) throw new Error('No data returned');

      // Map to local Project interface
      const updatedProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setProjects(projects.map(p =>
        p.id === editingProject.id ? updatedProject : p
      ));
      setShowEditDialog(false);
      setEditingProject(null);

      toast({
        title: "Project updated",
        description: "Your project has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error updating project",
        description: "Could not update the project. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>;
  }
  return <div className="bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Your Vendor Discovery Projects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage multiple vendor discovery workflows and track your progress across different technology requirements.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FolderOpen className="h-5 w-5" />
            <span>{projects.length} projects</span>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new vendor discovery workflow.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" placeholder="e.g., CRM System Selection" value={newProject.name} onChange={e => setNewProject({
                  ...newProject,
                  name: e.target.value
                })} />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" placeholder="Brief description of what you're looking for..." value={newProject.description} onChange={e => setNewProject({
                  ...newProject,
                  description: e.target.value
                })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Project Name</Label>
                <Input id="edit-name" placeholder="e.g., CRM System Selection" value={editedProject.name} onChange={e => setEditedProject({
                ...editedProject,
                name: e.target.value
              })} />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea id="edit-description" placeholder="Brief description of what you're looking for..." value={editedProject.description} onChange={e => setEditedProject({
                ...editedProject,
                description: e.target.value
              })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateProject}>
                Update Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {projects.length === 0 ? <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first vendor discovery project to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => <Card
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-medium group ${
                selectedProjectId === project.id ? 'ring-2 ring-primary shadow-large' : ''
              }`}
              onClick={() => onSelectProject(project)}
            >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      {project.description && <CardDescription>{project.description}</CardDescription>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={e => startEditProject(project, e)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {project.status.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default ProjectDashboard;