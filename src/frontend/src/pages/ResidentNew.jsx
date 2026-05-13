import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResidentFormExtended from '../components/ResidentFormExtended';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
// import api removed
import { useToast } from '../components/Toast';

export default function ResidentNew() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            addToast('Residente creado correctamente', 'success');
            navigate('/residents');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/residents');
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 pb-20">
                <ResidentFormExtended
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                />
            </div>
        </DashboardLayout>
    );
}
