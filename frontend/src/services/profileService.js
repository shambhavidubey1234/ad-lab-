// frontend/src/services/profileService.js
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/users/profile`, { // ✅ CHANGED /profile to /users/profile
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/users/profile`, { // ✅ CHANGED /profile to /users/profile
      method: "PUT",
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
};