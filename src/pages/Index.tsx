import { CollegeCutoffApp } from '@/components/CollegeCutoffApp';
import { AuthWrapper } from '@/components/AuthWrapper';

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <CollegeCutoffApp user={user} />}
    </AuthWrapper>
  );
};

export default Index;
