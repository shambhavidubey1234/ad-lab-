import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Grid
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Person,
  PersonAdd,
  Refresh,
  Download,
} from '@mui/icons-material';
import {
  getAllUsers,
  changeUserRole,
  changeUserStatus,
  deleteUser,
  exportUsers
} from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      };
      
      console.log('Fetching users with params:', params);
      
      const response = await getAllUsers(params);
      console.log('API Response:', response);
      
      // Handle different response structures
      if (response.data && response.data.success !== false) {
        // Check if data is nested
        const data = response.data.data || response.data || [];
        const total = response.data.total || response.data.length || 0;
        
        setUsers(Array.isArray(data) ? data : []);
        setTotalUsers(total);
      } else {
        // If API returns error
        const errorMessage = response.data?.message || 'Failed to load users';
        setError(errorMessage);
        setUsers([]);
        setTotalUsers(0);
        
        // Try fallback data
        if (users.length === 0) {
          console.log('Using fallback data');
          setUsers(getMockUsers());
          setTotalUsers(5);
        }
      }
    } catch (err) {
      console.error('Users fetch error:', err);
      
      // More specific error messages
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 404) {
          setError('API endpoint not found. Please check if backend is running.');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later.');
        } else if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          // Auto redirect handled by interceptor
        } else {
          setError(err.response.data?.message || `Error ${err.response.status}: Failed to load users`);
        }
      } else if (err.request) {
        // ✅ FIXED: Use environment variable instead of hardcoded localhost
        setError(`No response from server. Please check if backend is running at ${API_URL}`);
      } else {
        // Other errors
        setError(err.message || 'Failed to load users');
      }
      
      // Use mock data as fallback
      console.log('Using mock data due to API failure');
      setUsers(getMockUsers());
      setTotalUsers(5);
    } finally {
      setLoading(false);
    }
  };

  // Mock data function
  const getMockUsers = () => {
    return [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        collegeId: '2023001',
        department: 'Computer Science',
        year: '3rd',
        role: 'student',
        userStatus: 'ACTIVE',
        createdAt: '2023-10-15T10:30:00Z'
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        collegeId: '2023002',
        department: 'Electronics',
        year: '4th',
        role: 'club_admin',
        userStatus: 'ACTIVE',
        createdAt: '2023-10-14T14:20:00Z'
      },
      {
        _id: '3',
        name: 'Robert Johnson',
        email: 'robert@example.com',
        collegeId: '2023003',
        department: 'Mechanical',
        year: '2nd',
        role: 'student',
        userStatus: 'INACTIVE',
        createdAt: '2023-10-16T09:15:00Z'
      },
      {
        _id: '4',
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        collegeId: '2023004',
        department: 'Civil',
        year: '3rd',
        role: 'student',
        userStatus: 'ACTIVE',
        createdAt: '2023-10-13T16:45:00Z'
      },
      {
        _id: '5',
        name: 'Admin User',
        email: 'admin@college.edu',
        collegeId: 'ADMIN001',
        department: 'Administration',
        year: 'N/A',
        role: 'super_admin',
        userStatus: 'ACTIVE',
        createdAt: '2023-01-01T00:00:00Z'
      }
    ];
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchUsers();
      } else {
        setPage(0); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
    // Pre-fill values for dialogs
    setSelectedRole(user.role);
    setSelectedStatus(user.userStatus || 'ACTIVE');
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangeRole = async () => {
    try {
      setError('');
      await changeUserRole(selectedUser._id, selectedRole);
      setSuccess(`Role changed to ${selectedRole} successfully`);
      fetchUsers();
      setRoleDialogOpen(false);
    } catch (err) {
      console.error('Change role error:', err);
      setError(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleChangeStatus = async () => {
    try {
      setError('');
      await changeUserStatus(selectedUser._id, selectedStatus);
      setSuccess(`Status changed to ${selectedStatus} successfully`);
      fetchUsers();
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Change status error:', err);
      setError(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError('');
      await deleteUser(selectedUser._id);
      setSuccess('User deleted successfully');
      fetchUsers();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleExportUsers = async (format) => {
    try {
      setError('');
      const response = await exportUsers(format);
      
      if (format === 'csv') {
        // Create and download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('Users exported successfully');
      }
    } catch (err) {
      console.error('Export error:', err);
      
      // Create mock CSV for testing
      if (err.response?.status === 404 || err.response?.status === 500) {
        setError('Export API not available. Generating sample CSV...');
        
        // Create mock CSV data
        const csvContent = users.map(user => 
          `${user.name},${user.email},${user.collegeId},${user.department},${user.year},${user.role},${user.userStatus}`
        ).join('\n');
        
        const header = 'Name,Email,College ID,Department,Year,Role,Status\n';
        const blob = new Blob([header + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_mock_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('Sample CSV generated (mock data)');
      } else {
        setError('Failed to export users');
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'club_admin': return 'warning';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  const handleSnackbarClose = () => {
    setSuccess('');
    setError('');
  };

  if (loading && users.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading users...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          👥 User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all system users, roles, and permissions
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
              <TextField
                size="small"
                placeholder="Search users by name, email, college ID..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="contained">
                Search
              </Button>
            </form>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchUsers}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExportUsers('csv')}
                disabled={users.length === 0}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => window.location.href = '/admin/users/add'}
              >
                Add User
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>College ID</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found
                  </Typography>
                  {searchTerm && (
                    <Button 
                      variant="text" 
                      onClick={() => {
                        setSearchTerm('');
                        fetchUsers();
                      }}
                      sx={{ mt: 1 }}
                    >
                      Clear search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person />
                      <Box>
                        <Typography variant="body2">{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.collegeId}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.year}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role?.replace('_', ' ').toUpperCase() || 'N/A'}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.userStatus || 'ACTIVE'}
                      color={getStatusColor(user.userStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, user)}
                      disabled={user.role === 'super_admin'} // Don't allow editing super admins
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {users.length > 0 && (
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Users per page:"
        />
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setRoleDialogOpen(true);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Change Role
        </MenuItem>
        <MenuItem onClick={() => {
          setStatusDialogOpen(true);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1, fontSize: 20 }} /> Change Status
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} /> Delete User
        </MenuItem>
      </Menu>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="New Role"
              disabled={selectedUser?.role === 'super_admin'}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="club_admin">Club Admin</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleChangeRole} 
            variant="contained"
            disabled={selectedUser?.role === 'super_admin'}
          >
            Change Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Change User Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangeStatus} variant="contained">
            Change Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error"
            disabled={selectedUser?.role === 'super_admin'}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Debug Info (remove in production) */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Debug: Showing {users.length} of {totalUsers} users | Page {page + 1} | Search: "{searchTerm}" | 
          API: {API_URL}
        </Typography>
      </Box>
    </Container>
  );
};

export default UserManagement;