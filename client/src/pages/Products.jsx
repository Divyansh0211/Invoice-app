
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';

const Products = () => {
    const authContext = useContext(AuthContext);
    const { user, updateProfile } = authContext;

    const [products, setProducts] = useState([]);
    const [newClass, setNewClass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingClass, setIsAddingClass] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        productClass: '',
        quantity: 0
    });

    const { name, description, price, productClass, quantity } = formData;

    useEffect(() => {
        getProducts();
    }, []);

    const getProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/products', formData);
            setFormData({ name: '', description: '', price: '', productClass: '', quantity: 0 });
            getProducts();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteProduct = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await axios.delete(`/api/products/${id}`);
                getProducts();
            } catch (err) {
                console.error(err);
            }
        }
    }

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (newClass.trim() === '') return;

        setIsAddingClass(true);
        try {
            const updatedClasses = [...(user?.productClasses || []), newClass];
            await updateProfile({ productClasses: updatedClasses });
            setNewClass('');
        } finally {
            setIsAddingClass(false);
        }
    };



    return (
        <div className="grid-2">
            <div>
                <div className="card">
                    <h3>Manage Product Classes</h3>
                    <form onSubmit={handleAddClass}>
                        <div className="form-group">
                            <label>New Class Name</label>
                            <input
                                type="text"
                                value={newClass}
                                onChange={(e) => setNewClass(e.target.value)}
                                placeholder="e.g. Electronics"
                            />
                        </div>
                        <input type="submit" value={isAddingClass ? "Adding..." : "Add Class"} className="btn btn-dark btn-block" disabled={isAddingClass} />
                    </form>

                </div>
                <div className="card">
                    <h3>Add Product</h3>
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label>Product Name</label>
                            <input type="text" name="name" value={name} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Classification</label>
                            <select name="productClass" value={productClass} onChange={onChange}>
                                <option value="">Select Class</option>
                                {user && user.productClasses && user.productClasses.map((cls, index) => (
                                    <option key={index} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={description} onChange={onChange}></textarea>
                        </div>
                        <div className="form-group">
                            <label>Price</label>
                            <input type="number" name="price" value={price} onChange={onChange} required min="0" />
                        </div>
                        <div className="form-group">
                            <label>Stock Quantity</label>
                            <input type="number" name="quantity" value={quantity} onChange={onChange} required border="1px solid #ccc" />
                        </div>
                        <input type="submit" value={isSubmitting ? "Adding..." : "Add Product"} className="btn btn-primary btn-block" disabled={isSubmitting} />
                    </form>
                </div>
            </div>
            <div>
                <h3>Products List</h3>
                {products.map(product => (
                    <div key={product._id} className="card my-1">
                        <h4>{product.name}</h4>
                        {product.productClass && <span className="badge badge-light">{product.productClass}</span>}
                        <p>{product.description}</p>
                        <p className="text-primary">${product.price}</p>
                        <p><strong>Stock:</strong> {product.quantity}</p>
                        <button onClick={() => deleteProduct(product._id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;
