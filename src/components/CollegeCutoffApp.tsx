import { useState, useCallback, useEffect } from 'react';
import { GraduationCap, Database, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from './FileUpload';
import { CollegeTable } from './CollegeTable';
import { CollegeData, UserSession } from '@/types/college';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const CollegeCutoffApp = () => {
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [deletedColleges, setDeletedColleges] = useState<CollegeData[]>([]);
  const [lastAction, setLastAction] = useState<'delete' | 'reorder' | null>(null);
  const [lastActionData, setLastActionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const { toast } = useToast();

  // Save to Firebase
  const saveToFirebase = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionData: UserSession = {
        id: sessionId,
        colleges,
        deletedColleges,
        lastAction,
        lastActionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(collection(db, 'userSessions'), sessionId), sessionData);
      
      toast({
        title: "Data saved",
        description: "Your college preferences have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      toast({
        title: "Save failed",
        description: "Unable to save data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, colleges, deletedColleges, lastAction, lastActionData, toast]);

  // Load from Firebase
  const loadFromFirebase = useCallback(async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'userSessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSession;
        setColleges(data.colleges || []);
        setDeletedColleges(data.deletedColleges || []);
        setLastAction(data.lastAction || null);
        setLastActionData(data.lastActionData || null);
        
        toast({
          title: "Data loaded",
          description: "Your saved preferences have been restored",
        });
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      toast({
        title: "Load failed",
        description: "Unable to load saved data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, toast]);

  // Auto-save when data changes
  useEffect(() => {
    if (colleges.length > 0) {
      const timeoutId = setTimeout(() => {
        saveToFirebase();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [colleges, deletedColleges, saveToFirebase]);

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

    setLastActionData({ deletedCollege: collegeToDelete, previousIndex: colleges.findIndex(c => c.id === collegeId) });
    setLastAction('delete');
    setColleges(prev => prev.filter(c => c.id !== collegeId));
    setDeletedColleges(prev => [...prev, collegeToDelete]);
    
    toast({
      title: "College deleted",
      description: `${collegeToDelete.collegeName} has been moved to deleted section`,
    });
  }, [colleges, toast]);

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
    }

    setLastAction(null);
    setLastActionData(null);
  }, [lastAction, lastActionData, colleges, toast]);

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
                  Session: {sessionId.slice(-8)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFromFirebase}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Load Saved
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveToFirebase}
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

            <CollegeTable
              colleges={colleges}
              deletedColleges={deletedColleges}
              onReorder={handleReorder}
              onDelete={handleDelete}
              onUndo={handleUndo}
              lastAction={lastAction}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Data is automatically saved to Firebase. Session ID: {sessionId}</p>
        </div>
      </div>
    </div>
  );
};