export const getDevice = async () => {
    const response = await fetch('https://api-powergate.onrender.com/api/Dispositivo/1/estado');
    if (!response.ok) throw new Error('Algo salio mal. Intenta más tarde');
    return await response.json();
}

export const getOneDeviceData = async ({id}) =>{
    try {
        const response = await fetch(`https://api-powergate.onrender.com/api/Dispositivo/${id}/estado`);
        // const response = await fetch(`ws://host/ws/web?deviceId=${id}`);
        if (!response.ok) throw new Error(`Fallo la carga de datos ${response.status}`);
        const device = await response.json();
        // console.log(data);
        console.log(device.data.ubicacion);

        const newObjDevice = {
            ubicacion: device.data.ubicacion,
            canales: device.data.canales
        };

        return newObjDevice;
    } catch (error) {
        console.error('Error al conectar con el servicio',error);
        throw error;
    }
}

export const sentChangeStateWS = async ({channelId, state}) =>{
    try {
        const response = await fetch('https://api-powergate.onrender.com/api/Canal/rele',
            { 
                method: 'POST',
                headers: 
                {'Content-Type': 'application/json' },
                body:
                JSON.stringify({
                    canalId: channelId,
                    releActivo: state
                })
            }
        );

        const result = await response.json();
        console.log('Respuesta del api: ',result);
        return result;
        
    } catch (error) {
        console.error('Error al conectar con el equipo', error);
        throw error;
    }
}