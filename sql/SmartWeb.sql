USE [master]
GO

/****** Object:  Database [SmartWeb]    Script Date: 10/16/2024 7:41:42 PM ******/
CREATE DATABASE [SmartWeb]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'SmartWeb_Data', FILENAME = N'D:\rdsdbdata\DATA\SmartWeb_data.MDF' , SIZE = 1581696KB , MAXSIZE = UNLIMITED, FILEGROWTH = 10%)
 LOG ON 
( NAME = N'SmartWeb_Log', FILENAME = N'D:\rdsdbdata\DATA\SmartWeb_log.LDF' , SIZE = 2377088KB , MAXSIZE = 2048GB , FILEGROWTH = 10%)
GO

IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [SmartWeb].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO

ALTER DATABASE [SmartWeb] SET ANSI_NULL_DEFAULT OFF 
GO

ALTER DATABASE [SmartWeb] SET ANSI_NULLS OFF 
GO

ALTER DATABASE [SmartWeb] SET ANSI_PADDING OFF 
GO

ALTER DATABASE [SmartWeb] SET ANSI_WARNINGS OFF 
GO

ALTER DATABASE [SmartWeb] SET ARITHABORT OFF 
GO

ALTER DATABASE [SmartWeb] SET AUTO_CLOSE OFF 
GO

ALTER DATABASE [SmartWeb] SET AUTO_SHRINK OFF 
GO

ALTER DATABASE [SmartWeb] SET AUTO_UPDATE_STATISTICS ON 
GO

ALTER DATABASE [SmartWeb] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO

ALTER DATABASE [SmartWeb] SET CURSOR_DEFAULT  GLOBAL 
GO

ALTER DATABASE [SmartWeb] SET CONCAT_NULL_YIELDS_NULL OFF 
GO

ALTER DATABASE [SmartWeb] SET NUMERIC_ROUNDABORT OFF 
GO

ALTER DATABASE [SmartWeb] SET QUOTED_IDENTIFIER OFF 
GO

ALTER DATABASE [SmartWeb] SET RECURSIVE_TRIGGERS OFF 
GO

ALTER DATABASE [SmartWeb] SET  DISABLE_BROKER 
GO

ALTER DATABASE [SmartWeb] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO

ALTER DATABASE [SmartWeb] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO

ALTER DATABASE [SmartWeb] SET TRUSTWORTHY OFF 
GO

ALTER DATABASE [SmartWeb] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO

ALTER DATABASE [SmartWeb] SET PARAMETERIZATION SIMPLE 
GO

ALTER DATABASE [SmartWeb] SET READ_COMMITTED_SNAPSHOT OFF 
GO

ALTER DATABASE [SmartWeb] SET HONOR_BROKER_PRIORITY OFF 
GO

ALTER DATABASE [SmartWeb] SET RECOVERY FULL 
GO

ALTER DATABASE [SmartWeb] SET  MULTI_USER 
GO

ALTER DATABASE [SmartWeb] SET PAGE_VERIFY TORN_PAGE_DETECTION  
GO

ALTER DATABASE [SmartWeb] SET DB_CHAINING OFF 
GO

ALTER DATABASE [SmartWeb] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO

ALTER DATABASE [SmartWeb] SET TARGET_RECOVERY_TIME = 0 SECONDS 
GO

ALTER DATABASE [SmartWeb] SET DELAYED_DURABILITY = DISABLED 
GO

ALTER DATABASE [SmartWeb] SET QUERY_STORE = OFF
GO

USE [SmartWeb]
GO

ALTER DATABASE SCOPED CONFIGURATION SET LEGACY_CARDINALITY_ESTIMATION = OFF;
GO

ALTER DATABASE SCOPED CONFIGURATION SET MAXDOP = 0;
GO

ALTER DATABASE SCOPED CONFIGURATION SET PARAMETER_SNIFFING = ON;
GO

ALTER DATABASE SCOPED CONFIGURATION SET QUERY_OPTIMIZER_HOTFIXES = OFF;
GO

ALTER DATABASE [SmartWeb] SET  READ_WRITE 
GO

