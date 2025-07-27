import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { CollegeData } from '@/types/college';

interface AddCollegeModalProps {
  onAddCollege: (college: Omit<CollegeData, 'id' | 'order'>) => void;
}

export const AddCollegeModal = ({ onAddCollege }: AddCollegeModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    srNo: '',
    collegeName: '',
    branch: '',
    cutoff: '',
    numberOutsideBracket: '',
    numberInsideBracket: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCollege = {
      srNo: parseInt(formData.srNo) || 0,
      collegeName: formData.collegeName,
      branch: formData.branch,
      cutoff: parseFloat(formData.cutoff) || 0,
      numberOutsideBracket: parseInt(formData.numberOutsideBracket) || 0,
      numberInsideBracket: parseInt(formData.numberInsideBracket) || 0
    };

    onAddCollege(newCollege);
    
    // Reset form
    setFormData({
      srNo: '',
      collegeName: '',
      branch: '',
      cutoff: '',
      numberOutsideBracket: '',
      numberInsideBracket: ''
    });
    
    setOpen(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add College
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New College</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="srNo">SR No</Label>
              <Input
                id="srNo"
                type="number"
                value={formData.srNo}
                onChange={(e) => handleChange('srNo', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cutoff">Cutoff</Label>
              <Input
                id="cutoff"
                type="number"
                step="0.01"
                value={formData.cutoff}
                onChange={(e) => handleChange('cutoff', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="collegeName">College Name</Label>
            <Input
              id="collegeName"
              value={formData.collegeName}
              onChange={(e) => handleChange('collegeName', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => handleChange('branch', e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOutsideBracket">Outside Bracket</Label>
              <Input
                id="numberOutsideBracket"
                type="number"
                value={formData.numberOutsideBracket}
                onChange={(e) => handleChange('numberOutsideBracket', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="numberInsideBracket">Inside Bracket</Label>
              <Input
                id="numberInsideBracket"
                type="number"
                value={formData.numberInsideBracket}
                onChange={(e) => handleChange('numberInsideBracket', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add College</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};