import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import * as turf from '@turf/turf';

const Highbar = ({ map, routeCoordinates }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const exaggeration = 3;

    const updateElevationProfile = async () => {
        if (!map || !routeCoordinates || routeCoordinates.length < 2) return;

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
                return elevation / exaggeration;
            })
        );

        const lastElevation = await map.queryTerrainElevation(chunks[chunks.length - 1].geometry.coordinates[1]);
        terrainElevations.push(lastElevation / exaggeration);

        const routeElevations = await Promise.all(
            routeCoordinates.map(async (coord, index) => {
                const elevation = await map.queryTerrainElevation(coord.slice(0, 2));
                const routeElevation = coord[2] || elevation || 0;
                return routeElevation + (terrainElevations[index] || 0);
            })
        );

        const maxLength = Math.max(terrainElevations.length, routeElevations.length);
        const labels = Array.from({ length: maxLength }, (_, i) => i);

        // Синхронизируем данные, добавляя недостающие точки
        while (terrainElevations.length < maxLength) {
            terrainElevations.push(terrainElevations[terrainElevations.length - 1]);
        }
        while (routeElevations.length < maxLength) {
            routeElevations.push(routeElevations[routeElevations.length - 1]);
        }

        if (chartInstance.current) {
            chartInstance.current.data.labels = labels;
            chartInstance.current.data.datasets[0].data = terrainElevations;
            chartInstance.current.data.datasets[1].data = routeElevations;
            chartInstance.current.update();
        }
    };

    useEffect(() => {
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
                            backgroundColor: 'blue',
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4, // Увеличенный радиус точек
                            pointHoverRadius: 6, // Радиус наведения
                            pointHoverBorderWidth: 3 // Граница точки при наведении
                        },
                        {
                            label: 'Маршрут',
                            data: [],
                            borderColor: 'red',
                            backgroundColor: 'red',
                            fill: false,
                            tension: 0,
                            pointRadius: 4, // Увеличенный радиус точек
                            pointHoverRadius: 6, // Радиус наведения
                            pointHoverBorderWidth: 3 // Граница точки при наведении
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: 'white'
                            }
                        },
                        title: {
                            display: true,
                            align: 'start',
                            text: 'Elevation (m)',
                            color: 'white'
                        },
                        tooltip: {
                            mode: 'index', // Показ значений обеих линий при наведении
                            intersect: false // Наведение не требует точного совпадения с точкой
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: 'white' }
                        },
                        y: {
                            min: 0,
                            grid: { display: true },
                            ticks: { color: 'white' }
                        }
                    },
                    elements: { point: { radius: 0 } },
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
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-18%)',
        width: '60%',
        height: '25%',
        backgroundColor: 'rgba(50, 50, 50, 0.7)',
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        zIndex: 10,
        textAlign: 'center',
    },
    chartInnerContainer: {
        position: 'relative',
        bottom: '10px',
        margin: 'auto',
        height: '100%',
        width: '100%'
    }
};

export default Highbar;
