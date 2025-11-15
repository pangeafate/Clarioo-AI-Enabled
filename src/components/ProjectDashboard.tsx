import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, FolderOpen, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as projectService from "@/services/mock/projectService";
import { TYPOGRAPHY } from "@/styles/typography-config";
import { LoadingState } from "@/components/shared/loading/LoadingState";

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
  const { user } = useAuth();
  const {
    toast
  } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  // 🎨 PROTOTYPE MODE: Using mock project service
  const deleteProject = async () => {
    if (!editingProject) return;

    setIsDeleting(true);

    try {
      const { error } = await projectService.deleteProject(editingProject.id);

      if (error) throw new Error(error.message);

      // Remove project from list
      setProjects(projects.filter(p => p.id !== editingProject.id));
      setShowEditDialog(false);
      setShowDeleteConfirm(false);
      setEditingProject(null);

      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting project",
        description: "Could not delete the project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <LoadingState message="Loading your projects..." />
      </div>
    );
  }
  return <div className="bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div id="projects-section" className="mb-8 scroll-mt-4">
          <h1 className={`${TYPOGRAPHY.heading.h2} bg-gradient-to-r from-brand-blue to-brand-blueLight bg-clip-text text-transparent`}>
            My Projects
          </h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className={`flex items-center gap-2 ${TYPOGRAPHY.muted.default}`}>
            <FolderOpen className="h-5 w-5" />
            <span>{projects.length} projects</span>
          </div>
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
            <DialogFooter className="flex flex-col gap-3">
              {!showDeleteConfirm ? (
                <div className="flex gap-2 w-full">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateProject}
                    className="flex-1"
                  >
                    Update Project
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground text-center">
                    Are you sure you want to delete this project?
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteProject}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      {isDeleting ? "Deleting..." : "Delete Project"}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {projects.length === 0 ? <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🚀</div>
              <h3 className={`${TYPOGRAPHY.heading.h4} mb-2`}>No projects yet</h3>
              <p className={`${TYPOGRAPHY.muted.default} mb-6`}>
                Use the "New Project" button above to create your first vendor discovery project
              </p>
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
                    <div className={`flex items-center gap-1 ${TYPOGRAPHY.card.metadata}`}>
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