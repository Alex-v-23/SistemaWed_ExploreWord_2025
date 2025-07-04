--Base de datos PTC con las modificaciones de orden, upper camel case, normalizacion, restricciones 
--

-- Tabla Rangos
CREATE TABLE Rangos (
    IdRango INT PRIMARY KEY,
    NombreRango VARCHAR2(50) NOT NULL,
    RangoUsuario VARCHAR2(10) NOT NULL
);

-- Tabla Clientes
CREATE TABLE Clientes (
    IdCliente INT PRIMARY KEY,
    NombreCliente VARCHAR2(100) NOT NULL,
    ApellidoCliente VARCHAR2(100) NOT NULL,
    EmailCliente VARCHAR2(100) NOT NULL UNIQUE,
    Telefono VARCHAR2(20) NOT NULL,
    Direccion VARCHAR2(200) NOT NULL,
    DUI VARCHAR2(10) UNIQUE
);

-- Tabla Transportes
CREATE TABLE Transportes (
    IdTransporte INT PRIMARY KEY,
    MarcaTransporte VARCHAR2(100) NOT NULL,
    NumAsientos NUMBER(3) NOT NULL,
    ModeloTransporte VARCHAR2(50) NOT NULL,
    PlacaTransporte VARCHAR2(10) NOT NULL UNIQUE,
    EstadoTransporte VARCHAR2(20)
);

-- Tabla Servicios
CREATE TABLE Servicios (
    IdServicio INT PRIMARY KEY,
    NombreServicio VARCHAR2(100) NOT NULL,
    Descripcion VARCHAR2(100) NOT NULL,
    Costo NUMBER(10, 2) NOT NULL
);

-- Tabla Destinos
CREATE TABLE Destinos (
    IdDestino INT PRIMARY KEY,
    NombreDestino VARCHAR2(100) NOT NULL,
    LugarDestino VARCHAR2(100) NOT NULL,
    TipoDestino VARCHAR2(50) NOT NULL,
    DescripcionDestino VARCHAR2(200)
);

-- Tabla Hoteles
CREATE TABLE Hoteles (
    IdHotel INT PRIMARY KEY,
    NombreHotel VARCHAR2(100) NOT NULL,
    TipoHotel VARCHAR2(50) NOT NULL,
    Estrellas NUMBER(1) NOT NULL,
    Capacidad NUMBER(4) NOT NULL,
    Costo NUMBER(10, 2) NOT NULL,
    UbicacionHotel VARCHAR2(200) NOT NULL,
    Telefono VARCHAR2(20) NOT NULL,
    EmailHotel VARCHAR2(100) UNIQUE
);

-- Tabla Horarios
CREATE TABLE Horarios (
    IdHorario INT PRIMARY KEY,
    Hora DATE NOT NULL,
    TipoHorario VARCHAR2(50) NOT NULL,
    Disponibilidad VARCHAR2(50)
);

-- Tabla Eventos
CREATE TABLE Eventos (
    IdEvento INT PRIMARY KEY,
    IdDestino INT NOT NULL,
    NombreEvento VARCHAR2(100) NOT NULL,
    TipoEvento VARCHAR2(50) NOT NULL,
    LugarEvento VARCHAR2(100),
    FechaEvento DATE NOT NULL,
    DescripcionEvento VARCHAR2(200),
    CONSTRAINT FK_Eventos_Destinos FOREIGN KEY (IdDestino) REFERENCES Destinos(IdDestino)
);

-- Tabla Usuarios
CREATE TABLE Usuarios (
    IdUsuario INT PRIMARY KEY,
    IdRango INT NOT NULL,
    Estado VARCHAR2(20) NOT NULL,
    Usuario VARCHAR2(50) NOT NULL UNIQUE,
    Contraseña VARCHAR2(50) NOT NULL,
    CONSTRAINT FK_Usuarios_Rangos FOREIGN KEY (IdRango) REFERENCES Rangos(IdRango)
);

-- Tabla Empleados
CREATE TABLE Empleados (
    IdEmpleado INT PRIMARY KEY,
    IdRango INT NOT NULL,
    NombreEmpleado VARCHAR2(100) NOT NULL,
    ApellidoEmpleado VARCHAR2(100) NOT NULL,
    EmailEmpleado VARCHAR2(100) UNIQUE,
    FechaNacimiento DATE NOT NULL,
    Telefono VARCHAR2(20),
    Direccion VARCHAR2(200),
    Salario NUMBER(10, 2),
    CONSTRAINT FK_Empleados_Rangos FOREIGN KEY (IdRango) REFERENCES Rangos(IdRango)
);

-- Tabla Reservaciones
CREATE TABLE Reservaciones (
    IdReservacion INT PRIMARY KEY,
    IdCliente INT NOT NULL,
    IdHotel INT NOT NULL,
    TipoReservacion VARCHAR2(50) NOT NULL,
    DetalleDeReservacion VARCHAR2(200),
    FechaReservacion DATE NOT NULL,
    CONSTRAINT FK_Reservaciones_Clientes FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT FK_Reservaciones_Hoteles FOREIGN KEY (IdHotel) REFERENCES Hoteles(IdHotel)
    -- Eliminadas FK_Reservaciones_Horarios y FK_Reservaciones_Eventos
);

-- Tabla Viajes
CREATE TABLE Viajes (
    IdViaje INT PRIMARY KEY,
    IdCliente INT NOT NULL,
    IdEmpleado INT NOT NULL,
    IdTransporte INT NOT NULL,
    -- Eliminada IdDestino
    IdHorario INT, -- Si un viaje tiene un horario general, se mantiene. Si es por tramo, se gestiona en ViajeDestino.
    IdServicio INT, -- Si un viaje tiene un servicio general, se mantiene. Si es por tramo o reservación, se gestiona en tablas intermedias.
    FechaSalida DATE NOT NULL,
    FechaRegreso DATE NOT NULL,
    CONSTRAINT FK_Viajes_Clientes FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT FK_Viajes_Empleados FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado),
    CONSTRAINT FK_Viajes_Transportes FOREIGN KEY (IdTransporte) REFERENCES Transportes(IdTransporte),
    -- Eliminada FK_Viajes_Destinos
    CONSTRAINT FK_Viajes_Horarios FOREIGN KEY (IdHorario) REFERENCES Horarios(IdHorario),
    CONSTRAINT FK_Viajes_Servicios FOREIGN KEY (IdServicio) REFERENCES Servicios(IdServicio)
);

-- Tabla Facturas
CREATE TABLE Facturas (
    IdFactura INT PRIMARY KEY,
    IdReservacion INT NOT NULL,
    FechaPago DATE NOT NULL,
    MetodoPago VARCHAR2(50) NOT NULL,
    MontoTotal NUMBER(10, 2) NOT NULL,
    CONSTRAINT FK_Facturas_Reservaciones FOREIGN KEY (IdReservacion) REFERENCES Reservaciones(IdReservacion)
    -- Eliminadas FK_Facturas_Clientes y FK_Facturas_Hoteles
);

-- Tabla Pagos
CREATE TABLE Pagos (
    IdPago INT PRIMARY KEY,
    IdReservacion INT NOT NULL,
    MetodoPago VARCHAR2(50) NOT NULL,
    Pago NUMBER(10, 2) NOT NULL,
    FechaPago DATE NOT NULL,
    EstadoPago VARCHAR2(20) NOT NULL,
    CONSTRAINT FK_Pagos_Reservaciones FOREIGN KEY (IdReservacion) REFERENCES Reservaciones(IdReservacion)
);

-- Tabla Presupuestos
CREATE TABLE Presupuestos (
    IdPresupuesto INT PRIMARY KEY,
    IdCliente INT NOT NULL,
    CantidadPresupuesto NUMBER(10, 2) NOT NULL,
    DetallesPresupuesto VARCHAR2(200),
    FechaRegistro DATE NOT NULL,
    CONSTRAINT FK_Presupuestos_Clientes FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente)
);

-- Tabla Boletos
CREATE TABLE Boletos (
    IdBoleto INT PRIMARY KEY,
    IdReservacion INT NOT NULL,
    -- Eliminada IdCliente (ya está en Reservaciones)
    IdViaje INT NOT NULL,
    FechaVencimiento DATE NOT NULL,
    Monto NUMBER(10, 2) NOT NULL,
    Asientos VARCHAR2(20),
    CONSTRAINT FK_Boletos_Reservaciones FOREIGN KEY (IdReservacion) REFERENCES Reservaciones(IdReservacion),
    -- Eliminada FK_Boletos_Clientes
    CONSTRAINT FK_Boletos_Viajes FOREIGN KEY (IdViaje) REFERENCES Viajes(IdViaje)
);

-- Tabla intermedia Viaje_Destino
CREATE TABLE ViajeDestino (
    IdViajeDestino INT PRIMARY KEY,
    IdViaje INT NOT NULL,
    IdDestino INT NOT NULL,
    OrdenDestino INT NOT NULL,
    DuracionEstancia VARCHAR2(50),
    ActividadesPlanificadas VARCHAR2(255),
    CONSTRAINT FK_ViajeDestino_Viajes FOREIGN KEY (IdViaje) REFERENCES Viajes(IdViaje),
    CONSTRAINT FK_ViajeDestino_Destinos FOREIGN KEY (IdDestino) REFERENCES Destinos(IdDestino),
    CONSTRAINT UK_ViajeDestino UNIQUE (IdViaje, IdDestino, OrdenDestino)
);

-- Tabla intermedia Reservacion_Servicio
CREATE TABLE ReservacionServicio (
    IdReservacionServicio INT PRIMARY KEY,
    IdReservacion INT NOT NULL,
    IdServicio INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario NUMBER(10, 2) NOT NULL,
    FechaHoraServicio DATE,
    Descripcion VARCHAR2(255),
    CONSTRAINT FK_ReservacionServicio_Reservaciones FOREIGN KEY (IdReservacion) REFERENCES Reservaciones(IdReservacion),
    CONSTRAINT FK_ReservacionServicio_Servicios FOREIGN KEY (IdServicio) REFERENCES Servicios(IdServicio),
    CONSTRAINT UK_ReservacionServicio UNIQUE (IdReservacion, IdServicio)
);

-- Tabla intermedia Reservacion_Evento
CREATE TABLE ReservacionEvento (
    IdReservacionEvento INT PRIMARY KEY,
    IdReservacion INT NOT NULL,
    IdEvento INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario NUMBER(10, 2),
    FechaHoraEvento DATE NOT NULL,
    Descripcion VARCHAR2(200),
    CONSTRAINT FK_ReservacionEvento_Reservaciones FOREIGN KEY (IdReservacion) REFERENCES Reservaciones(IdReservacion),
    CONSTRAINT FK_ReservacionEvento_Eventos FOREIGN KEY (IdEvento) REFERENCES Eventos(IdEvento),
    CONSTRAINT UK_ReservacionEvento UNIQUE (IdReservacion, IdEvento, FechaHoraEvento)
);

--Tabla intermedia Viaje_Empleado
CREATE TABLE ViajeEmpleado (
    IdViajeEmpleado INT PRIMARY KEY,
    IdViaje INT NOT NULL,
    IdEmpleado INT NOT NULL,
    RolEnViaje VARCHAR2(50),
    FechaInicioParticipacion DATE,
    FechaFinParticipacion DATE,
    CONSTRAINT FK_ViajeEmpleado_Viajes FOREIGN KEY (IdViaje) REFERENCES Viajes(IdViaje),
    CONSTRAINT FK_ViajeEmpleado_Empleados FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado),
    CONSTRAINT UK_ViajeEmpleado UNIQUE (IdViaje, IdEmpleado)
);