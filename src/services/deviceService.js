export const getDevice = async () => {
    const response = await fetch('https://api-powergate.onrender.com/api/Dispositivo/1/estado');
    if (!response.ok) throw new Error('Algo salio mal. Intenta más tarde');
    return await response.json();
}

export const getLastCanalActive = async () =>{
    // pendiente logica
}