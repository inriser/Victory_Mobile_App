import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export const useIndicesGroups = () => {
    const [groups, setGroups] = useState({ indices: [], sectors: [], themes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/indices/groups`);
                const json = await res.json();
                if (json.success && json.data) {
                    // json.data is already {indices: [], sectors: [], themes: []}
                    setGroups(json.data);
                } else {
                    setGroups({ indices: [], sectors: [], themes: [] });
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    return { groups, loading, error };
};
