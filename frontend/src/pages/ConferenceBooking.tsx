import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@shared/schema';

// Required slots from 10:30 AM to 7:30 PM (9 slots)
const PREDEFINED_SLOTS = [
    "10:30 AM - 11:30 AM",
    "11:30 AM - 12:30 PM",
    "12:30 PM - 01:30 PM",
    "01:30 PM - 02:30 PM",
    "02:30 PM - 03:30 PM",
    "03:30 PM - 04:30 PM",
    "04:30 PM - 05:30 PM",
    "05:30 PM - 06:30 PM",
    "06:30 PM - 07:30 PM"
];

export default function ConferenceBooking() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const displayDate = format(selectedDate, 'EEEE, MMMM do, yyyy');

    // Fetch bookings for the selected date
    const { data: bookings = [], isLoading } = useQuery<Booking[]>({
        queryKey: ['/api/bookings', { date: formattedDate }],
        queryFn: async () => {
            const res = await fetch(`/api/bookings?date=${formattedDate}`, {
                headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch bookings');
            return res.json();
        }
    });

    // Real-time updates listener
    useEffect(() => {
        const handleUpdate = (event: CustomEvent<any>) => {
            // If the update is for the current viewed date (or generic), refetch
            const updatedDate = event.detail?.date;
            if (!updatedDate || updatedDate === formattedDate) {
                queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
            }
        };

        window.addEventListener('booking-update', handleUpdate as EventListener);
        return () => {
            window.removeEventListener('booking-update', handleUpdate as EventListener);
        };
    }, [formattedDate, queryClient]);

    const bookSlotMutation = useMutation({
        mutationFn: async (slotTime: string) => {
            const res = await apiRequest('POST', '/api/bookings', {
                slotTime,
                date: formattedDate,
                userId: user?.id,
                userName: user?.name
            });
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Slot Booked', description: 'You have successfully booked the conference room.' });
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        },
        onError: (error: Error) => {
            toast({ title: 'Booking Failed', description: error.message, variant: 'destructive' });
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await apiRequest('DELETE', `/api/bookings/${bookingId}`);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Slot Released', description: 'Booking has been cancelled.' });
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        },
        onError: (error: Error) => {
            toast({ title: 'Cancellation Failed', description: error.message, variant: 'destructive' });
        }
    });

    const handleBook = (slotTime: string) => {
        if (!user) return;
        bookSlotMutation.mutate(slotTime);
    };

    const handleDelete = (bookingId: string) => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            deleteBookingMutation.mutate(bookingId);
        }
    };

    const getSlotStatus = (slotTime: string) => {
        const booking = bookings.find(b => b.slotTime === slotTime);
        if (!booking) return { status: 'available', booking: null };

        // Check if current user owns the booking or is admin
        const isOwner = user?.id === booking.userId;
        const isAdmin = user?.role === 'admin';
        const canDelete = isOwner || isAdmin;

        return {
            status: 'booked',
            booking,
            canDelete
        };
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Conference Room</h2>
                        <p className="text-muted-foreground mt-2">Book slots for meetings (10:30 AM - 7:30 PM)</p>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center space-x-4 bg-card p-2 rounded-lg border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center space-x-2 font-medium">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span>{displayDate}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PREDEFINED_SLOTS.map((slotTime) => {
                        const { status, booking, canDelete } = getSlotStatus(slotTime);

                        return (
                            <Card key={slotTime} className={`border-l-4 ${status === 'booked' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-medium">{slotTime}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {status === 'available' ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center text-green-600 text-sm font-medium">
                                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                Available
                                            </div>
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => handleBook(slotTime)}
                                                disabled={bookSlotMutation.isPending}
                                            >
                                                Book Slot
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-start text-red-600 text-sm font-medium">
                                                <User className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                <span className="break-words">
                                                    Booked by {booking?.userName}
                                                </span>
                                            </div>

                                            {canDelete && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    onClick={() => handleDelete(booking!.id)}
                                                    disabled={deleteBookingMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Cancel Booking
                                                </Button>
                                            )}

                                            {!canDelete && (
                                                <Button variant="secondary" disabled className="w-full opacity-50 cursor-not-allowed">
                                                    Unavailable
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
