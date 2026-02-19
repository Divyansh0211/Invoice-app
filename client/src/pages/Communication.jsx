import React from 'react';
import axios from 'axios';

const Communication = () => {
    const [staffList, setStaffList] = React.useState([]);
    const [selectedStaff, setSelectedStaff] = React.useState([]);
    const [emailData, setEmailData] = React.useState({
        subject: '',
        message: ''
    });
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const [msg, setMsg] = React.useState(null);

    const { subject, message } = emailData;

    React.useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await axios.get('/api/staff');
                setStaffList(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch staff');
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const onSelectStaff = (email) => {
        if (selectedStaff.includes(email)) {
            setSelectedStaff(selectedStaff.filter(e => e !== email));
        } else {
            setSelectedStaff([...selectedStaff, email]);
        }
    };

    const onSelectAll = () => {
        if (selectedStaff.length === staffList.length) {
            setSelectedStaff([]);
        } else {
            setSelectedStaff(staffList.map(s => s.email));
        }
    };

    const onChange = e => setEmailData({ ...emailData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setSending(true);
        if (selectedStaff.length === 0) {
            alert('Please select at least one recipient.');
            setSending(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({
                subject,
                message,
                recipients: selectedStaff
            });
            const res = await axios.post('/api/staff/send-email', body, config);
            setMsg({ type: 'success', content: res.data.msg });
            setEmailData({ subject: '', message: '' });
            setSelectedStaff([]);
            setSending(false);
        } catch (err) {
            setMsg({ type: 'danger', content: err.response && err.response.data.msg ? err.response.data.msg : 'Failed to send email' });
            setSending(false);
        }
    };

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h1 className="large text-primary">Communication</h1>
            <p className="lead"><i className="fas fa-comments"></i> Send announcements to your team</p>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.content}</div>}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: '1', minWidth: '300px' }}>
                    <h3>1. Select Recipients</h3>
                    {loading ? <p>Loading staff...</p> : (
                        <div>
                            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={staffList.length > 0 && selectedStaff.length === staffList.length}
                                        onChange={onSelectAll}
                                        style={{ marginRight: '10px' }}
                                    />
                                    Select All ({staffList.length})
                                </label>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {staffList.map(staff => (
                                    <div key={staff._id} style={{ padding: '5px 0' }}>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStaff.includes(staff.email)}
                                                onChange={() => onSelectStaff(staff.email)}
                                                style={{ marginRight: '10px' }}
                                            />
                                            <span>
                                                <strong>{staff.name}</strong> <br />
                                                <small className="text-secondary">{staff.email}</small>
                                            </span>
                                        </label>
                                    </div>
                                ))}
                                {staffList.length === 0 && <p>No staff to display.</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card" style={{ flex: '2', minWidth: '300px' }}>
                    <h3>2. Compose Message</h3>
                    <form className="form" onSubmit={onSubmit}>
                        <div className="form-group">
                            <label>Subject</label>
                            <input type="text" name="subject" value={subject} onChange={onChange} required placeholder="Email Subject" />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                name="message"
                                value={message}
                                onChange={onChange}
                                required
                                placeholder="Write your message here..."
                                rows="10"
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', borderColor: '#ccc' }}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={sending}>
                            {sending ? 'Sending...' : 'Send Email'} <i className="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Communication;
