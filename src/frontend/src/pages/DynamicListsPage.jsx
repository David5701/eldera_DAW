import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DynamicLists from '../components/DynamicLists';
import { useNavigate } from 'react-router-dom';

export default function DynamicListsPage() {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 pb-20">
                <DynamicLists onBack={() => navigate('/')} />
            </div>
        </DashboardLayout>
    );
}
