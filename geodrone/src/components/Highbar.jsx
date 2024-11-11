import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import * as turf from '@turf/turf';
import MapContainer from './MapContainer';
const Highbar = ({ map, routeCoordinates }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const exaggeration = 3;

    // Функция для обновления профиля рельефа и маршрута
    const updateElevationProfile = async () => {
        if (!map || !routeCoordinates || routeCoordinates.length < 2) return;
    
        console.log('Received routeCoordinates:', routeCoordinates);
    
        const lineData = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: routeCoordinates.map(coord => [coord[0], coord[1]])
            }
        };
    
        const chunks = turf.lineChunk(lineData, 1).features;
    
        const terrainElevations = await Promise.all(
            chunks.map(async (feature) => {
                const elevation = await map.queryTerrainElevation(feature.geometry.coordinates[0]);
                const adjustedElevation = elevation / exaggeration;
                console.log('Original Elevation:', elevation, 'Adjusted Elevation:', adjustedElevation);
                return adjustedElevation;
            })
        );
    
        const lastElevation = await map.queryTerrainElevation(chunks[chunks.length - 1].geometry.coordinates[1]);
        const adjustedLastElevation = lastElevation / exaggeration;
        console.log('Original Elevation:', lastElevation, 'Adjusted Elevation:', adjustedLastElevation);
    
        terrainElevations.push(adjustedLastElevation);
    
        const routeElevations = await Promise.all(
            routeCoordinates.map(async (coord, index) => {
                const elevation = await map.queryTerrainElevation(coord.slice(0, 2));
                const routeElevation = coord[2] || elevation || 0;

                // Суммируем высоту маршрута с рельефом
                const adjustedRouteElevation = routeElevation + (terrainElevations[index] || 0);
                return adjustedRouteElevation;
            })
        );
    
        console.log('Terrain Elevations:', terrainElevations);
        console.log('Route Elevations:', routeElevations);
    
        // Обновляем график
        if (chartInstance.current) {
            // Генерируем метки для оси X
            const labels = Array.from({ length: terrainElevations.length }, (_, i) => i);
    
            chartInstance.current.data.labels = labels;
            chartInstance.current.data.datasets[0].data = terrainElevations;
            chartInstance.current.data.datasets[1].data = routeElevations;
    
            // Даем немного времени для рендеринга данных
            setTimeout(() => {
                chartInstance.current.update();
            }, 0);  // Асинхронное обновление данных графика
        } else {
            console.error('Chart instance is not initialized');
        }
    };

    useEffect(() => {
        // Инициализация графика при первом рендере
        if (!chartInstance.current && chartRef.current) {
            chartInstance.current = new Chart(chartRef.current, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Рельеф местности',
                            data: [],
                            borderColor: 'blue',
                            fill: false,
                            tension: 0.4
                        },
                        {
                            label: 'Маршрут',
                            data: [],
                            borderColor: 'red',
                            fill: false,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: true
                        },
                        title: {
                            display: true,
                            align: 'start',
                            text: 'Elevation (m)'
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            min: 0,
                            grid: {
                                display: false
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    },
                    layout: {
                        padding: {
                            top: 6,
                            right: 20,
                            bottom: -10,
                            left: 20
                        }
                    }
                }
            });
        }
        
        // Проверка, что данные обновляются и график рендерится
        console.log('useEffect triggered, routeCoordinates:', routeCoordinates);
        updateElevationProfile();
    }, [map, routeCoordinates]);

    return (
        <div style={styles.chartContainer}>
            <div style={styles.chartInnerContainer}>
                <canvas ref={chartRef} />
            </div>
        </div>
    );
};

const styles = {
    chartContainer: {
        height: '90%',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center'
    },
    chartInnerContainer: {
        position: 'relative',
        margin: 'auto',
        height: '100%',
        width: '100vw'
    }
};

export default Highbar;
