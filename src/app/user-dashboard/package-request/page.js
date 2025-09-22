"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../../lib/userContext";

function PackageRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useUser();
  
  const [packageData, setPackageData] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: "",
    transactionReceipt: "",
    notes: ""
  });
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const packageId = searchParams.get('packageId');

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
      fetchBankAccounts();
    }
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        const selectedPackage = data.packages.find(pkg => pkg.id === parseInt(packageId));
        if (selectedPackage) {
          setPackageData(selectedPackage);
        } else {
          alert('Package not found');
          router.push('/user-dashboard/subscribe');
        }
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      alert('Error fetching package details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      } else {
        console.error('Failed to fetch bank accounts:', response.status);
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Store the file for later upload
    setSelectedFile(file);
    
    // Convert to base64 for preview only
    const base64Data = await convertImageToBase64(file);
    setImagePreview(base64Data);
  };

  // Convert image to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload image to external API
  const uploadImageToAPI = async (base64Data) => {
    try {
      console.log('Starting image upload to external API...');
      
      const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data
        })
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload API response:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const imageUrl = result.url || result.imageUrl;
      console.log('Extracted image URL:', imageUrl);
      
      if (!imageUrl) {
        throw new Error('No image URL returned from upload API');
      }

      return imageUrl; // Return the uploaded image URL
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.transactionId || !selectedFile) {
      alert('Please fill in all required fields including the transaction receipt');
      return;
    }

    if (!isAuthenticated || !user) {
      alert('Please log in to submit a package request');
      return;
    }

    console.log('User authentication check:', { isAuthenticated, userId: user?.id });

    setSubmitting(true);

    try {
      // First upload the image
      const base64Data = await convertImageToBase64(selectedFile);
      console.log('Image converted to base64, length:', base64Data.length);
      
      let imageUrl;
      let base64Fallback;
      
      try {
        imageUrl = await uploadImageToAPI(base64Data);
        console.log('Image uploaded successfully, URL:', imageUrl);
      } catch (uploadError) {
        console.warn('External image upload failed, using base64 fallback:', uploadError.message);
        // Fallback: use base64 data directly (not recommended for production)
        base64Fallback = `data:image/jpeg;base64,${base64Data.split(',')[1]}`;
        console.log('Using base64 fallback, length:', base64Fallback.length);
      }
      
      // Then submit the package request with the image URL
      const requestData = {
        userId: user.id,
        packageId: parseInt(packageId),
        transactionId: formData.transactionId,
        transactionReceipt: imageUrl || base64Fallback,
        notes: formData.notes,
        status: 'pending'
      };

      console.log('Submitting package request with data:', requestData);
      console.log('User object:', user);
      console.log('Package ID:', packageId);

      const response = await fetch('/api/package-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Package request submitted successfully! It will be reviewed by admin.');
          router.push('/user-dashboard/my-package');
        } else {
          alert('Failed to submit request: ' + result.message);
        }
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading package details...</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Package Not Found</h3>
          <p className="text-gray-400 mb-6">The requested package could not be found.</p>
          <Link
            href="/user-dashboard/subscribe"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Package Request</h1>
            <p className="text-gray-400 mt-2">Submit your package request with payment details</p>
          </div>
          <Link
            href="/user-dashboard/subscribe"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Back to Packages
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Selected Package</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Package ID:</span>
              <span className="text-white font-medium">{packageData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Package Title:</span>
              <span className="text-white font-medium">{packageData.package_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Package Amount:</span>
              <span className="text-white font-medium">PKR {parseFloat(packageData.package_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shopping Amount:</span>
              <span className="text-white font-medium">PKR {parseFloat(packageData.shopping_amount).toFixed(2)}</span>
            </div>
            {packageData.rank && (
              <div className="flex justify-between">
                <span className="text-gray-400">Rank:</span>
                <span className="text-white font-medium">{packageData.rank.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Payment Bank Accounts</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account, index) => (
                <div key={account.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-white">{account.bank_title}</h3>
                      <span className="bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded-full">
                        Account #{index + 1}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Account Title:</span>
                        <span className="text-white text-sm font-medium">{account.account_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Account Number:</span>
                        <span className="text-white text-sm font-mono">{account.bank_accountno}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">IBAN:</span>
                        <span className="text-white text-sm font-mono">{account.iban_no}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-gray-400">No bank accounts available</p>
              </div>
            )}
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Request Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transaction ID *
              </label>
              <input
                type="text"
                required
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                placeholder="Enter your transaction ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transaction Receipt *
              </label>
                                            <input
                 type="file"
                 required
                 accept="image/*"
                 onChange={handleFileChange}
                 disabled={submitting}
                 className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
               />
               <p className="text-xs text-gray-400 mt-1">
                 Upload your payment receipt (JPG, PNG only, max 5MB)
               </p>
               {submitting && (
                 <div className="flex items-center mt-2">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                   <span className="text-xs text-blue-400">Uploading receipt...</span>
                 </div>
               )}
               
               {/* Image Preview */}
               {imagePreview && (
                 <div className="mt-3">
                   <img
                     src={imagePreview}
                     alt="Receipt Preview"
                     className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                   />
                   <div className="flex items-center justify-between mt-2">
                     <p className="text-xs text-green-400">✓ Receipt uploaded successfully</p>
                     <button
                       type="button"
                                               onClick={() => {
                          setImagePreview('');
                          setSelectedFile(null);
                          setFormData(prev => ({ ...prev, transactionReceipt: '' }));
                        }}
                       className="text-xs text-red-400 hover:text-red-300"
                     >
                       Remove
                     </button>
                   </div>
                 </div>
               )}
             </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

                         <button
               type="submit"
               disabled={submitting || !selectedFile}
               className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {submitting ? 'Submitting...' : 'Submit Package Request'}
             </button>
          </form>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Payment Instructions</h2>
                 <div className="space-y-3 text-gray-300">
           <div className="flex items-start">
             <span className="text-blue-400 mr-2">1.</span>
             <p>Choose one of the bank accounts listed above to make your payment.</p>
           </div>
           <div className="flex items-start">
             <span className="text-blue-400 mr-2">2.</span>
             <p>Transfer the exact package amount to the selected bank account.</p>
           </div>
           <div className="flex items-start">
             <span className="text-blue-400 mr-2">3.</span>
             <p>Get your transaction ID from your payment confirmation.</p>
           </div>
           <div className="flex items-start">
             <span className="text-blue-400 mr-2">4.</span>
             <p>Take a clear photo or scan of your payment receipt (JPG/PNG only).</p>
           </div>
           <div className="flex items-start">
             <span className="text-blue-400 mr-2">5.</span>
             <p>Upload the receipt image and submit your request for admin approval.</p>
           </div>
         </div>
      </div>
    </div>
  );
}

export default function PackageRequest() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackageRequestForm />
    </Suspense>
  );
}
