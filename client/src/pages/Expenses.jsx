
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { getCurrencySymbol } from '../utils/currencyMap';

const Expenses = () => {
    const authContext = useContext(AuthContext);
    const { user } = authContext;
    const [expenses, setExpenses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const { amount, category, description, date } = formData;
    const currency = user?.settings?.currency || 'USD';

    const activeWorkspaceId = user?.activeWorkspace?._id || user?.activeWorkspace;
    const userRole = user?.workspaces?.find(w => w.workspace === activeWorkspaceId || w.workspace?._id === activeWorkspaceId)?.role || 'Staff';
    const isPrivileged = userRole === 'Owner' || userRole === 'Admin';

    useEffect(() => {
        getExpenses();
    }, [user?.activeWorkspace]);

    const getExpenses = async () => {
        try {
            const res = await axios.get('/api/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/expenses', formData);
            setFormData({
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            getExpenses();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteExpense = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await axios.delete(`/api/expenses/${id}`);
                getExpenses();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="grid-2">
            <div>
                {isPrivileged ? (
                    <div className="card">
                        <h3>Add New Expense</h3>
                        <form onSubmit={onSubmit}>
                            <div className="form-group">
                                <label>Amount</label>
                                <input type="number" name="amount" value={amount} onChange={onChange} required min="0.01" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={category} onChange={onChange} required>
                                    <option value="">Select Category</option>
                                    <option value="Rent">Rent</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Salaries">Salaries</option>
                                    <option value="Supplies">Supplies</option>
                                    <option value="travel">Travel</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" name="date" value={date} onChange={onChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={description} onChange={onChange}></textarea>
                            </div>
                            <input type="submit" value={isSubmitting ? "Adding..." : "Add Expense"} className="btn btn-primary btn-block" disabled={isSubmitting} />
                        </form>
                    </div>
                ) : (
                    <div className="card">
                        <h3>View Expenses</h3>
                        <p>Only Admins or Owners can add new expenses.</p>
                    </div>
                )}
            </div>

            <div>
                <div className="card mb-2">
                    <h3>Total Expenses: {getCurrencySymbol(currency)} {totalExpenses.toFixed(2)}</h3>
                </div>

                <div className="card">
                    <h3>Expense History</h3>
                    <ul className="list">
                        {expenses.length > 0 ? (
                            expenses.map(expense => (
                                <li key={expense._id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{expense.category}</strong> - {new Date(expense.date).toLocaleDateString()}
                                        <br />
                                        <span className="text-secondary">{expense.description}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="text-danger" style={{ fontWeight: 'bold', display: 'block' }}>
                                            - {getCurrencySymbol(currency)} {expense.amount.toFixed(2)}
                                        </span>
                                        {isPrivileged && (
                                            <button onClick={() => deleteExpense(expense._id)} className="btn btn-danger btn-sm" style={{ marginTop: '5px' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : <p>No expenses recorded.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
