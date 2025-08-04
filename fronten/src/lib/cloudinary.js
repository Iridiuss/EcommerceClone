export const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'your_preset_here');
  
    const res = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
      method: 'POST',
      body: data
    });
  
    const result = await res.json();
    return result.secure_url;
  };