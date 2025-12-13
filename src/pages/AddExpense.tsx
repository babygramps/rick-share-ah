import { useNavigate } from 'react-router-dom';
import { ExpenseForm } from '../components/expenses/ExpenseForm';

export function AddExpense() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <ExpenseForm 
        onSubmit={() => navigate('/')} 
        onCancel={() => navigate('/')}
      />
    </div>
  );
}


