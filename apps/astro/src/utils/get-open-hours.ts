export const getOpenHours = (data: { from: string; to: string; closeWeekends: boolean }) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const paddedHours = hours.toString().padStart(2, '0')
    return `${paddedHours}:${minutes.toString().padStart(2, '0')}`
  }

  return {
    days: data.closeWeekends ? 'Pn.-Pt.:' : 'Codziennie:',
    time: `${formatTime(data.from)} - ${formatTime(data.to)}`,
  }
}
