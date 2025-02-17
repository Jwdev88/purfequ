import React, { useState } from "react";

const NewsletterBox = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const onSubmitHandler = (event) => {
        event.preventDefault();
        if (!email.includes("@")) {
            setMessage("Please enter a valid email address.");
            return;
        }
        setMessage("Thank you for subscribing! 🎉");
        setEmail(""); // Reset input setelah submit
    };

    return (
        <div className="text-center px-4">
            {/* Improved SEO Heading */}
            <h2 className="text-2xl font-semibold text-gray-900">
                Subscribe now & get <span className="text-blue-600">20% off</span>
            </h2>
            <p className="text-gray-500 mt-2">
                Stay updated with our latest offers and promotions. Join our newsletter today!
            </p>

            {/* Subscription Form */}
            <form 
                onSubmit={onSubmitHandler} 
                className="w-full sm:w-1/2 flex items-center gap-3 mx-auto border pl-3 mt-4 rounded-lg overflow-hidden"
                aria-label="Newsletter subscription form"
            >
                <input 
                    className="w-full sm:flex-1 outline-none p-3 text-gray-700"
                    type="email"  
                    placeholder="Enter your email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Enter your email to subscribe"
                />
                <button 
                    type="submit" 
                    className="bg-black text-white text-xs px-6 py-3 transition duration-200 hover:bg-gray-800"
                    aria-label="Subscribe to our newsletter"
                >
                    Subscribe
                </button>
            </form>

            {/* Feedback Message */}
            {message && (
                <p className="mt-3 text-sm text-green-600" aria-live="polite">
                    {message}
                </p>
            )}
        </div>
    );
};

export default NewsletterBox;
