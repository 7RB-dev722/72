import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, purchaseImagesService, Product, PurchaseImage } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { AnimatedBackground } from './AnimatedBackground';
import { Home, AlertTriangle, Camera, Send, X, Mail, Phone as PhoneIcon, Monitor } from 'lucide-react';

const ImagePaymentPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [purchaseImage, setPurchaseImage] = useState<PurchaseImage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { settings, loading: settingsLoading } = useSettings();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAnydesk, setCustomerAnydesk] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (productId) {
            const fetchPaymentDetails = async () => {
                try {
                    setLoading(true);
                    const productData = await productService.getProductById(productId);
                    setProduct(productData);

                    if (!productData.purchase_image_id) {
                        setError("Image-based payment is not available for this product.");
                    } else {
                        const imageData = await purchaseImagesService.getById(productData.purchase_image_id);
                        setPurchaseImage(imageData);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to load payment details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPaymentDetails();
        }
    }, [productId]);

    const handleTelegramSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerEmail || !customerPhone || !customerAnydesk) {
            setFormError('Please fill in all fields.');
            return;
        }
        setFormError('');

        if (!product || !settings.telegram_url) {
            setFormError('Cannot create Telegram link. Settings are unavailable.');
            return;
        }

        const message = `
New Purchase Request:
Product: ${product.title}
Price: $${product.price}
---
Customer Details:
Email: ${customerEmail}
Phone: ${customerPhone}
AnyDesk ID: ${customerAnydesk}
        `.trim();

        const telegramUrl = `${settings.telegram_url}?text=${encodeURIComponent(message)}`;
        
        window.open(telegramUrl, '_blank');
        setIsModalOpen(false);
        // Reset form
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerAnydesk('');
    };

    if (loading || settingsLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
                <AnimatedBackground />
                <div className="min-h-screen flex items-center justify-center relative z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                        <p className="text-white">Loading Payment Details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !purchaseImage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
                <AnimatedBackground />
                <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
                    <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">An Error Occurred</h2>
                        <p className="text-red-300 mb-6">{error || 'Could not load payment image.'}</p>
                        <Link to="/" className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">
                            <Home className="w-5 h-5" />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return null; // Should be handled by error state
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative text-white">
            <AnimatedBackground />
            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Pay for {product.title}
                        </h1>
                        <p className="text-2xl font-bold text-cyan-300">${product.price}</p>
                    </div>

                    <div className="mb-8">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-600 flex justify-center">
                            <img src={purchaseImage.image_url} alt={`Payment for ${product.title}`} className="rounded-lg max-w-xs w-full" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-3"><Camera className="w-6 h-6 text-cyan-400" /><span>Payment Instructions</span></h2>
                            <ol className="list-decimal list-inside space-y-3 text-gray-300">
                                <li>Open the camera on your mobile phone.</li>
                                <li>Scan the QR code shown above.</li>
                                <li>Open the link that appears on your screen.</li>
                                <li>Complete the payment process.</li>
                                <li>Take a screenshot of the purchase receipt.</li>
                            </ol>
                        </div>

                        <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                             <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-3"><Send className="w-6 h-6 text-blue-400" /><span>Product Delivery</span></h2>
                            <p className="text-gray-300 mb-4">After payment, click the button below and submit your details on Telegram to receive your product key.</p>
                             <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Send className="w-6 h-6" />
                                <span>Contact via Telegram & Submit Details</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-2">
                            <Home className="w-4 h-4" />
                            <span>Back to All Products</span>
                        </Link>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Submit Purchase Details</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleTelegramSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder="example@email.com" required />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder="e.g., +1234567890" required />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">AnyDesk ID/Address *</label>
                                <div className="relative">
                                    <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={customerAnydesk} onChange={(e) => setCustomerAnydesk(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder="123 456 789" required />
                                </div>
                            </div>
                            {formError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
                                    {formError}
                                </div>
                            )}
                            <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                                Send to Telegram
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImagePaymentPage;
