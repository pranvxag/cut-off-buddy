import { useState, useCallback, useEffect } from 'react';
import { GraduationCap, Database, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from './FileUpload';
import { CollegeTable } from './CollegeTable';
import { AddCollegeModal } from './AddCollegeModal';
import { CollegeData, UserSession } from '@/types/college';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CollegeCutoffAppProps {
  user: User;
}

export const SupabaseCollegeCutoffApp = ({ user }: CollegeCutoffAppProps) => {
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [deletedColleges, setDeletedColleges] = useState<CollegeData[]>([]);
  const [lastAction, setLastAction] = useState<'delete' | 'reorder' | 'restore' | null>(null);
  const [lastActionData, setLastActionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Save to Supabase
  const saveToSupabase = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Save colleges
      const { error: deleteError } = await supabase
        .from('colleges')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert current colleges (both active and deleted)
      const allColleges = [...colleges, ...deletedColleges];
      if (allColleges.length > 0) {
        const collegesData = allColleges.map(college => ({
          user_id: user.id,
          sr_no: college.srNo,
          college_name: college.collegeName,
          branch: college.branch,
          cutoff: college.cutoff,
          number_outside_bracket: college.numberOutsideBracket,
          number_inside_bracket: college.numberInsideBracket,
          order_position: college.order,
          original_order: college.originalOrder,
          is_deleted: deletedColleges.some(dc => dc.id === college.id)
        }));

        const { error: insertError } = await supabase
          .from('colleges')
          .insert(collegesData);

        if (insertError) throw insertError;
      }

      // Save session state
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          last_action: lastAction,
          last_action_data: lastActionData
        });

      if (sessionError) throw sessionError;
      
      toast({
        title: "Data saved",
        description: "Your college preferences have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast({
        title: "Save failed",
        description: "Unable to save data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, colleges, deletedColleges, lastAction, lastActionData, toast]);

  // Load from Supabase
  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load colleges
      const { data: collegesData, error: collegesError } = await supabase
        .from('colleges')
        .select('*')
        .eq('user_id', user.id)
        .order('order_position');

      if (collegesError) throw collegesError;

      if (collegesData && collegesData.length > 0) {
        const loadedColleges: CollegeData[] = [];
        const loadedDeletedColleges: CollegeData[] = [];

        collegesData.forEach(college => {
          const collegeData: CollegeData = {
            id: college.id,
            srNo: college.sr_no,
            collegeName: college.college_name,
            branch: college.branch,
            cutoff: college.cutoff,
            numberOutsideBracket: college.number_outside_bracket,
            numberInsideBracket: college.number_inside_bracket,
            order: college.order_position,
            originalOrder: college.original_order
          };

          if (college.is_deleted) {
            loadedDeletedColleges.push(collegeData);
          } else {
            loadedColleges.push(collegeData);
          }
        });

        setColleges(loadedColleges);
        setDeletedColleges(loadedDeletedColleges);
      }

      // Load session state
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('Session load error:', sessionError);
      } else if (sessionData) {
        setLastAction(sessionData.last_action as 'delete' | 'reorder' | 'restore' | null);
        setLastActionData(sessionData.last_action_data);
      }
      
      if (collegesData && collegesData.length > 0) {
        toast({
          title: "Data loaded",
          description: "Your saved preferences have been restored",
        });
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      toast({
        title: "Load failed",
        description: "Unable to load saved data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Auto-save when data changes
  useEffect(() => {
    if (colleges.length > 0) {
      const timeoutId = setTimeout(() => {
        saveToSupabase();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [colleges, deletedColleges, saveToSupabase]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      loadFromSupabase();
    }
  }, [user, loadFromSupabase]);

  const handleDataExtracted = useCallback((data: CollegeData[]) => {
    setColleges(data);
    setDeletedColleges([]);
    setLastAction(null);
    setLastActionData(null);
  }, []);

  const handleReorder = useCallback((reorderedColleges: CollegeData[]) => {
    setLastActionData({ previousOrder: [...colleges] });
    setLastAction('reorder');
    setColleges(reorderedColleges);
  }, [colleges]);

  const handleDelete = useCallback((collegeId: string) => {
    const collegeToDelete = colleges.find(c => c.id === collegeId);
    if (!collegeToDelete) return;

    // Store original position for restoration
    const collegeWithOriginalOrder = { ...collegeToDelete, originalOrder: collegeToDelete.order };
    
    setLastActionData({ deletedCollege: collegeWithOriginalOrder, previousIndex: colleges.findIndex(c => c.id === collegeId) });
    setLastAction('delete');
    setColleges(prev => prev.filter(c => c.id !== collegeId));
    setDeletedColleges(prev => [...prev, collegeWithOriginalOrder]);
    
    toast({
      title: "College deleted",
      description: `${collegeToDelete.collegeName} has been moved to deleted section`,
    });
  }, [colleges, toast]);

  const handleRestore = useCallback((collegeId: string) => {
    const collegeToRestore = deletedColleges.find(c => c.id === collegeId);
    if (!collegeToRestore) return;

    // Insert back at original position or at the end if original position is not available
    const insertPosition = collegeToRestore.originalOrder !== undefined ? collegeToRestore.originalOrder : colleges.length;
    const updatedColleges = [...colleges];
    
    // Remove originalOrder property before inserting back
    const { originalOrder, ...restoredCollege } = collegeToRestore;
    
    // Adjust orders for insertion
    updatedColleges.forEach(college => {
      if (college.order >= insertPosition) {
        college.order += 1;
      }
    });
    
    restoredCollege.order = insertPosition;
    updatedColleges.splice(insertPosition, 0, restoredCollege);
    
    // Reorder to maintain consistency
    updatedColleges.sort((a, b) => a.order - b.order);
    updatedColleges.forEach((college, index) => {
      college.order = index;
    });

    setLastActionData({ restoredCollege: collegeToRestore, previousColleges: colleges, previousDeleted: deletedColleges });
    setLastAction('restore');
    setColleges(updatedColleges);
    setDeletedColleges(prev => prev.filter(c => c.id !== collegeId));
    
    toast({
      title: "College restored",
      description: `${collegeToRestore.collegeName} has been restored to its original position`,
    });
  }, [colleges, deletedColleges, toast]);

  const handleUndo = useCallback(() => {
    if (!lastAction || !lastActionData) return;

    if (lastAction === 'delete') {
      const { deletedCollege, previousIndex } = lastActionData;
      const newColleges = [...colleges];
      newColleges.splice(previousIndex, 0, deletedCollege);
      setColleges(newColleges);
      setDeletedColleges(prev => prev.filter(c => c.id !== deletedCollege.id));
      
      toast({
        title: "Delete undone",
        description: `${deletedCollege.collegeName} has been restored`,
      });
    } else if (lastAction === 'reorder') {
      setColleges(lastActionData.previousOrder);
      
      toast({
        title: "Reorder undone",
        description: "College order has been restored to previous state",
      });
    } else if (lastAction === 'restore') {
      const { restoredCollege, previousColleges, previousDeleted } = lastActionData;
      
      setColleges(previousColleges);
      setDeletedColleges(previousDeleted);
      
      toast({
        title: "Restore undone",
        description: `${restoredCollege.collegeName} has been moved back to deleted section`,
      });
    }

    setLastAction(null);
    setLastActionData(null);
  }, [lastAction, lastActionData, colleges, toast]);

  const handleAddCollege = useCallback((newCollegeData: Omit<CollegeData, 'id' | 'order'>) => {
    const newCollege: CollegeData = {
      ...newCollegeData,
      id: `college-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: colleges.length
    };

    setColleges(prev => [...prev, newCollege]);
    
    toast({
      title: "College added",
      description: `${newCollege.collegeName} has been added to the list`,
    });
  }, [colleges.length, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-academic-green bg-clip-text text-transparent">
              CAP Round 1 Cutoff Manager
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Upload, organize, and manage college cutoff data with intelligent sorting and preference tracking
          </p>
        </div>

        {/* Controls */}
        {colleges.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="w-4 h-4" />
                  User: {user.email}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFromSupabase}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Load Saved
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveToSupabase}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Now'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        {colleges.length === 0 ? (
          <FileUpload onDataExtracted={handleDataExtracted} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">College Cutoff Data</h2>
                <p className="text-muted-foreground">Drag and drop to reorder according to your preference</p>
              </div>
              <div className="flex items-center gap-2">
                <AddCollegeModal onAddCollege={handleAddCollege} />
                <Button
                  variant="outline"
                  onClick={() => {
                    setColleges([]);
                    setDeletedColleges([]);
                    setLastAction(null);
                    setLastActionData(null);
                  }}
                >
                  Upload New File
                </Button>
              </div>
            </div>

        <CollegeTable
          colleges={colleges}
          deletedColleges={deletedColleges}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onUndo={handleUndo}
          lastAction={lastAction}
        />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Data is automatically saved to Supabase. User: {user.email}</p>
        </div>
      </div>
    </div>
  );
};