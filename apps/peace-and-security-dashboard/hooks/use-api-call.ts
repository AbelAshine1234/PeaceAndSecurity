import { useState } from 'react';
import { toast } from 'sonner';

export interface UseApiCallOptions {
    successMessage?: string;
    errorMessage?: string;
    showLoadingToast?: boolean;
    loadingMessage?: string;
}

export function useApiCall<T = any>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = async (
        apiCall: () => Promise<T>,
        options: UseApiCallOptions = {}
    ): Promise<T | null> => {
        const {
            successMessage,
            errorMessage,
            showLoadingToast = true,
            loadingMessage = 'Loading...',
        } = options;

        setLoading(true);
        setError(null);

        let loadingToastId: string | number | undefined;
        if (showLoadingToast) {
            loadingToastId = toast.loading(loadingMessage);
        }

        try {
            const result = await apiCall();
            setData(result);

            if (loadingToastId) {
                toast.dismiss(loadingToastId);
            }

            if (successMessage) {
                toast.success(successMessage);
            }

            return result;
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || err?.message || 'An error occurred';
            setError(errMsg);

            if (loadingToastId) {
                toast.dismiss(loadingToastId);
            }

            toast.error(errorMessage || errMsg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLoading(false);
        setError(null);
        setData(null);
    };

    return { loading, error, data, execute, reset };
}
