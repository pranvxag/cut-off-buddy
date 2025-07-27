import { SupabaseAuthWrapper } from '@/components/SupabaseAuthWrapper';
import { SupabaseCollegeCutoffApp } from '@/components/SupabaseCollegeCutoffApp';

const Index = () => {
  return (
    <SupabaseAuthWrapper>
      {(user) => <SupabaseCollegeCutoffApp user={user} />}
    </SupabaseAuthWrapper>
  );
};

export default Index;
