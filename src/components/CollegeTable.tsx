import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Trash2, Undo2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CollegeData } from '@/types/college';

interface CollegeTableProps {
  colleges: CollegeData[];
  deletedColleges: CollegeData[];
  onReorder: (reorderedColleges: CollegeData[]) => void;
  onDelete: (collegeId: string) => void;
  onUndo: () => void;
  lastAction: 'delete' | 'reorder' | null;
}

export const CollegeTable = ({
  colleges,
  deletedColleges,
  onReorder,
  onDelete,
  onUndo,
  lastAction
}: CollegeTableProps) => {
  const [sortField, setSortField] = useState<keyof CollegeData>('numberInsideBracket');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  const handleSort = useCallback((field: keyof CollegeData) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...colleges].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return newDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return newDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Update order property
    sorted.forEach((college, index) => {
      college.order = index;
    });

    onReorder(sorted);
  }, [colleges, sortField, sortDirection, onReorder]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(colleges);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    items.forEach((college, index) => {
      college.order = index;
    });

    onReorder(items);
    
    toast({
      title: "Colleges reordered",
      description: "The college order has been updated according to your preference",
    });
  }, [colleges, onReorder, toast]);

  const SortIcon = ({ field }: { field: keyof CollegeData }) => (
    <ArrowUpDown 
      className={`inline w-4 h-4 ml-1 ${
        sortField === field ? 'text-primary' : 'text-muted-foreground'
      }`} 
    />
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            {colleges.length} Colleges
          </Badge>
          {deletedColleges.length > 0 && (
            <Badge variant="outline" className="px-3 py-1">
              {deletedColleges.length} Deleted
            </Badge>
          )}
        </div>
        
        {lastAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Undo {lastAction === 'delete' ? 'Delete' : 'Reorder'}
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-table-border">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">
                    Drag
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('srNo')}
                  >
                    SR No
                    <SortIcon field="srNo" />
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('collegeName')}
                  >
                    College Name
                    <SortIcon field="collegeName" />
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('branch')}
                  >
                    Branch
                    <SortIcon field="branch" />
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('cutoff')}
                  >
                    Cutoff
                    <SortIcon field="cutoff" />
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('numberOutsideBracket')}
                  >
                    Outside Bracket
                    <SortIcon field="numberOutsideBracket" />
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-data-hover"
                    onClick={() => handleSort('numberInsideBracket')}
                  >
                    Inside Bracket (Percentile)
                    <SortIcon field="numberInsideBracket" />
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <Droppable droppableId="colleges">
                {(provided) => (
                  <tbody {...provided.droppableProps} ref={provided.innerRef}>
                    {colleges.map((college, index) => (
                      <Draggable key={college.id} draggableId={college.id} index={index}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border-b border-table-border hover:bg-data-hover transition-colors ${
                              snapshot.isDragging ? 'bg-academic-blue-light shadow-lg' : ''
                            }`}
                          >
                            <td 
                              {...provided.dragHandleProps}
                              className="p-4 cursor-move"
                            >
                              <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                                ⋮⋮
                              </div>
                            </td>
                            <td className="p-4 text-foreground font-medium">
                              {college.srNo}
                            </td>
                            <td className="p-4 text-foreground max-w-xs truncate">
                              {college.collegeName}
                            </td>
                            <td className="p-4 text-foreground">
                              {college.branch}
                            </td>
                            <td className="p-4 text-foreground font-mono">
                              {college.cutoff}
                            </td>
                            <td className="p-4 text-foreground font-mono">
                              {college.numberOutsideBracket}
                            </td>
                            <td className="p-4 text-foreground font-mono font-semibold">
                              {college.numberInsideBracket}
                            </td>
                            <td className="p-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(college.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </DragDropContext>
        </div>
      </Card>

      {/* Deleted Colleges Section */}
      {deletedColleges.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Deleted Colleges</h3>
          <div className="space-y-2">
            {deletedColleges.map((college) => (
              <div 
                key={college.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-table-border"
              >
                <div className="flex-1">
                  <span className="font-medium text-foreground">{college.collegeName}</span>
                  <span className="text-muted-foreground ml-2">- {college.branch}</span>
                  <span className="text-muted-foreground ml-2">(Percentile: {college.numberInsideBracket})</span>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive">
                  Deleted
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};