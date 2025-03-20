export const getOpenHours = (data: { from: string; to: string; closedWeekends: boolean }) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const paddedHours = hours.toString().padStart(2, '0')
    return `${paddedHours}:${minutes.toString().padStart(2, '0')}`
  }

  return `${data.closedWeekends ? 'Pn.-Pt.' : 'Codziennie'}: ${formatTime(data.from)} - ${formatTime(data.to)}`
}
