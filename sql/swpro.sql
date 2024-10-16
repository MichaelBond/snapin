USE [master]
GO

/****** Object:  Database [swpro]    Script Date: 10/16/2024 7:39:29 PM ******/
CREATE DATABASE [swpro]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'swpro', FILENAME = N'D:\rdsdbdata\DATA\swpro.mdf' , SIZE = 6144KB , MAXSIZE = UNLIMITED, FILEGROWTH = 1024KB )
 LOG ON 
( NAME = N'swpro_log', FILENAME = N'D:\rdsdbdata\DATA\swpro_log.ldf' , SIZE = 4224KB , MAXSIZE = 2048GB , FILEGROWTH = 10%)
GO

IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [swpro].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO

ALTER DATABASE [swpro] SET ANSI_NULL_DEFAULT OFF 
GO

ALTER DATABASE [swpro] SET ANSI_NULLS OFF 
GO

ALTER DATABASE [swpro] SET ANSI_PADDING OFF 
GO

ALTER DATABASE [swpro] SET ANSI_WARNINGS OFF 
GO

ALTER DATABASE [swpro] SET ARITHABORT OFF 
GO

ALTER DATABASE [swpro] SET AUTO_CLOSE OFF 
GO

ALTER DATABASE [swpro] SET AUTO_SHRINK OFF 
GO

ALTER DATABASE [swpro] SET AUTO_UPDATE_STATISTICS ON 
GO

ALTER DATABASE [swpro] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO

ALTER DATABASE [swpro] SET CURSOR_DEFAULT  GLOBAL 
GO

ALTER DATABASE [swpro] SET CONCAT_NULL_YIELDS_NULL OFF 
GO

ALTER DATABASE [swpro] SET NUMERIC_ROUNDABORT OFF 
GO

ALTER DATABASE [swpro] SET QUOTED_IDENTIFIER OFF 
GO

ALTER DATABASE [swpro] SET RECURSIVE_TRIGGERS OFF 
GO

ALTER DATABASE [swpro] SET  DISABLE_BROKER 
GO

ALTER DATABASE [swpro] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO

ALTER DATABASE [swpro] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO

ALTER DATABASE [swpro] SET TRUSTWORTHY OFF 
GO

ALTER DATABASE [swpro] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO

ALTER DATABASE [swpro] SET PARAMETERIZATION SIMPLE 
GO

ALTER DATABASE [swpro] SET READ_COMMITTED_SNAPSHOT OFF 
GO

ALTER DATABASE [swpro] SET HONOR_BROKER_PRIORITY OFF 
GO

ALTER DATABASE [swpro] SET RECOVERY FULL 
GO

ALTER DATABASE [swpro] SET  MULTI_USER 
GO

ALTER DATABASE [swpro] SET PAGE_VERIFY CHECKSUM  
GO

ALTER DATABASE [swpro] SET DB_CHAINING OFF 
GO

ALTER DATABASE [swpro] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO

ALTER DATABASE [swpro] SET TARGET_RECOVERY_TIME = 0 SECONDS 
GO

ALTER DATABASE [swpro] SET DELAYED_DURABILITY = DISABLED 
GO

ALTER DATABASE [swpro] SET QUERY_STORE = OFF
GO

USE [swpro]
GO

ALTER DATABASE SCOPED CONFIGURATION SET LEGACY_CARDINALITY_ESTIMATION = OFF;
GO

ALTER DATABASE SCOPED CONFIGURATION SET MAXDOP = 0;
GO

ALTER DATABASE SCOPED CONFIGURATION SET PARAMETER_SNIFFING = ON;
GO

ALTER DATABASE SCOPED CONFIGURATION SET QUERY_OPTIMIZER_HOTFIXES = OFF;
GO

ALTER DATABASE [swpro] SET  READ_WRITE 
GO

