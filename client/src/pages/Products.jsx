import { useState, useEffect } from 'react';
import axios from 'axios';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: ''
    });

    const { name, description, price } = formData;

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
        try {
            await axios.post('/api/products', formData);
            setFormData({ name: '', description: '', price: '' });
            getProducts();
        } catch (err) {
            console.error(err);
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

    return (
        <div className="grid-2">
            <div>
                <div className="card">
                    <h3>Add Product</h3>
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label>Product Name</label>
                            <input type="text" name="name" value={name} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={description} onChange={onChange}></textarea>
                        </div>
                        <div className="form-group">
                            <label>Price</label>
                            <input type="number" name="price" value={price} onChange={onChange} required min="0" />
                        </div>
                        <input type="submit" value="Add Product" className="btn btn-primary btn-block" />
                    </form>
                </div>
            </div>
            <div>
                <h3>Products List</h3>
                {products.map(product => (
                    <div key={product._id} className="card my-1">
                        <h4>{product.name}</h4>
                        <p>{product.description}</p>
                        <p className="text-primary">${product.price}</p>
                        <button onClick={() => deleteProduct(product._id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;
